import type { Room, GameSocket, ClientMessage, StageResult } from "./types.ts";
import {
  getRoom,
  getRoomForSocket,
  createRoom,
  joinRoom,
  removePlayer,
  startGame,
  resetForRematch,
  roomToJSON,
} from "./rooms.ts";

const playerSockets = new Map<string, GameSocket>();

function broadcast(room: Room, data: Record<string, unknown>): void {
  const msg = JSON.stringify(data);
  for (const player of room.players) {
    const ws = playerSockets.get(player.id);
    if (ws && ws.readyState === 1) {
      ws.send(msg);
    }
  }
}

function broadcastExcept(room: Room, excludeId: string, data: Record<string, unknown>): void {
  const msg = JSON.stringify(data);
  for (const player of room.players) {
    if (player.id === excludeId) {
      continue;
    }
    const ws = playerSockets.get(player.id);
    if (ws && ws.readyState === 1) {
      ws.send(msg);
    }
  }
}

function send(ws: GameSocket, data: Record<string, unknown>): void {
  ws.send(JSON.stringify(data));
}

function handleJoin(ws: GameSocket, msg: { roomId: string; playerName: string }): void {
  // If this socket already joined, ignore duplicate join (React Strict Mode)
  if (ws.data.playerId) {
    const existingRoom = getRoomForSocket(ws);
    if (existingRoom) {
      send(ws, { event: "room-state", room: roomToJSON(existingRoom), playerId: ws.data.playerId });
      return;
    }
  }

  let room = getRoom(msg.roomId);
  if (!room) {
    room = createRoom();
  }

  if (room.state !== "lobby") {
    send(ws, { event: "error", message: "Game already in progress" });
    return;
  }

  const player = joinRoom(room, msg.playerName, ws);
  ws.data.playerId = player.id;
  ws.data.roomId = room.id;
  playerSockets.set(player.id, ws);

  send(ws, { event: "room-state", room: roomToJSON(room), playerId: player.id });
  broadcastExcept(room, player.id, { event: "player-joined", player });
}

function handleReady(ws: GameSocket, msg: { ready: boolean }): void {
  const room = getRoomForSocket(ws);
  if (!room || room.state !== "lobby") {
    return;
  }

  const player = room.players.find((p) => p.id === ws.data.playerId);
  if (!player) {
    return;
  }

  player.ready = msg.ready;
  broadcast(room, { event: "player-ready", playerId: player.id, ready: player.ready });

  // Check if all players ready
  if (room.players.length > 0 && room.players.every((p) => p.ready)) {
    startCountdown(room);
  }
}

function startCountdown(room: Room): void {
  room.state = "countdown";
  let seconds = 3;

  broadcast(room, { event: "countdown", seconds });

  const tick = () => {
    seconds--;
    if (seconds > 0) {
      broadcast(room, { event: "countdown", seconds });
      room.countdownTimer = setTimeout(tick, 1000);
    } else {
      room.countdownTimer = null;
      startGame(room);
      broadcast(room, {
        event: "game-start",
        stages: room.stages,
        seed: room.seed,
      });
    }
  };

  room.countdownTimer = setTimeout(tick, 1000);
}

function handleStageComplete(
  ws: GameSocket,
  msg: { stageIndex: number; timeMs: number; success: boolean },
): void {
  const room = getRoomForSocket(ws);
  if (!room || room.state !== "playing") {
    return;
  }

  const player = room.players.find((p) => p.id === ws.data.playerId);
  if (!player || player.finished) {
    return;
  }

  const result: StageResult = {
    playerId: player.id,
    stageIndex: msg.stageIndex,
    timeMs: msg.timeMs,
    success: msg.success,
  };

  // Store result
  if (!room.stageResults.has(msg.stageIndex)) {
    room.stageResults.set(msg.stageIndex, []);
  }
  room.stageResults.get(msg.stageIndex)!.push(result);

  // Advance player
  player.currentStage = msg.stageIndex + 1;
  if (player.currentStage >= room.stages.length) {
    player.finished = true;
  }

  // Reset stage start time
  room.stageStartTimes.set(player.id, Date.now());

  // Broadcast progress
  broadcast(room, {
    event: "player-progress",
    playerId: player.id,
    stageIndex: player.currentStage,
  });

  // Check if all results for this stage are in
  const stageResults = room.stageResults.get(msg.stageIndex) ?? [];
  if (stageResults.length === room.players.length) {
    // Award point to fastest successful player
    const successful = stageResults
      .filter((r) => r.success)
      .sort((a, b) => a.timeMs - b.timeMs);

    if (successful.length > 0) {
      const winnerId = successful[0]!.playerId;
      const winner = room.players.find((p) => p.id === winnerId);
      if (winner) {
        winner.score++;
      }
    }

    broadcast(room, {
      event: "stage-result",
      stageIndex: msg.stageIndex,
      results: stageResults,
    });
  }

  // Check if all players finished
  if (room.players.every((p) => p.finished)) {
    const rankings = [...room.players].sort((a, b) => b.score - a.score);
    room.state = "results";
    broadcast(room, { event: "game-end", rankings });
  }
}

function handleRematch(ws: GameSocket): void {
  const room = getRoomForSocket(ws);
  if (!room || room.state !== "results") {
    return;
  }

  resetForRematch(room);
  broadcast(room, { event: "room-state", room: roomToJSON(room), playerId: "" });
}

export function handleMessage(ws: GameSocket, raw: string): void {
  let msg: ClientMessage;
  try {
    msg = JSON.parse(raw) as ClientMessage;
  } catch {
    return;
  }

  switch (msg.event) {
    case "join":
      handleJoin(ws, msg);
      break;
    case "ready":
      handleReady(ws, msg);
      break;
    case "stage-complete":
      handleStageComplete(ws, msg);
      break;
    case "rematch":
      handleRematch(ws);
      break;
  }
}

export function handleClose(ws: GameSocket): void {
  const result = removePlayer(ws);
  if (result) {
    playerSockets.delete(result.player.id);
    if (result.room.players.length > 0) {
      broadcast(result.room, { event: "player-left", playerId: result.player.id });
    }
  }
}
