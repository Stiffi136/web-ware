import type { Room, Player, GameSocket, GameConfig, StageConfig, Difficulty } from "./types.ts";
import { DEFAULT_CONFIG } from "./types.ts";

const rooms = new Map<string, Room>();
const socketToRoom = new Map<GameSocket, string>();

const STAGE_TYPES = ["captcha", "password", "data-form", "download-button", "online-shop", "installer", "cookie-banner", "age-verification", "spam-filter", "ad-popup"];

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 4; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(id) ? generateRoomId() : id;
}

function deriveStageSeed(roomSeed: number, stageIndex: number): number {
  let h = roomSeed ^ (stageIndex * 2654435761);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 0;
}

function generateStages(seed: number, config: GameConfig): StageConfig[] {
  const stages: StageConfig[] = [];
  let rand = seed;
  const nextRand = () => {
    rand = (rand + 0x6d2b79f5) | 0;
    let t = Math.imul(rand ^ (rand >>> 15), 1 | rand);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let round = 0; round < config.maxDifficulty; round++) {
    const difficulty = (round + 1) as Difficulty;
    const available = [...STAGE_TYPES];
    for (let s = 0; s < config.stagesPerDifficulty; s++) {
      const idx = Math.floor(nextRand() * available.length);
      const type = available.splice(idx, 1)[0]!;
      const stageIndex = stages.length;
      stages.push({
        type,
        difficulty,
        seed: deriveStageSeed(seed, stageIndex),
      });
    }
  }
  return stages;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getRoomForSocket(ws: GameSocket): Room | undefined {
  const roomId = socketToRoom.get(ws);
  return roomId ? rooms.get(roomId) : undefined;
}

export function createRoom(): Room {
  const room: Room = {
    id: generateRoomId(),
    state: "lobby",
    players: [],
    stages: [],
    seed: 0,
    createdAt: Date.now(),
    stageResults: new Map(),
    stageStartTimes: new Map(),
    countdownTimer: null,
    config: { ...DEFAULT_CONFIG },
  };
  rooms.set(room.id, room);
  return room;
}

export function joinRoom(room: Room, playerName: string, ws: GameSocket): Player {
  const player: Player = {
    id: crypto.randomUUID(),
    name: playerName,
    ready: false,
    score: 0,
    currentStage: 0,
    finished: false,
  };
  room.players.push(player);
  socketToRoom.set(ws, room.id);
  return player;
}

export function removePlayer(ws: GameSocket): { room: Room; player: Player } | null {
  const roomId = socketToRoom.get(ws);
  if (!roomId) {
    return null;
  }
  socketToRoom.delete(ws);

  const room = rooms.get(roomId);
  if (!room) {
    return null;
  }

  const wsData = ws.data;
  const playerIndex = room.players.findIndex((p) => p.id === wsData.playerId);
  if (playerIndex === -1) {
    return null;
  }

  const player = room.players.splice(playerIndex, 1)[0]!;

  if (room.players.length === 0) {
    if (room.countdownTimer) {
      clearTimeout(room.countdownTimer);
    }
    rooms.delete(roomId);
  }

  return { room, player };
}

export function startGame(room: Room): void {
  room.seed = Date.now();
  room.stages = generateStages(room.seed, room.config);
  room.state = "playing";
  room.stageResults.clear();
  room.stageStartTimes.clear();
  for (const player of room.players) {
    player.score = 0;
    player.currentStage = 0;
    player.finished = false;
    player.ready = false;
    room.stageStartTimes.set(player.id, Date.now());
  }
}

export function resetForRematch(room: Room): void {
  room.state = "lobby";
  room.stages = [];
  room.seed = 0;
  room.stageResults.clear();
  room.stageStartTimes.clear();
  for (const player of room.players) {
    player.score = 0;
    player.currentStage = 0;
    player.finished = false;
    player.ready = false;
  }
}

export function updateConfig(room: Room, config: GameConfig): void {
  room.config = {
    stagesPerDifficulty: Math.max(2, Math.min(10, config.stagesPerDifficulty)),
    maxDifficulty: Math.max(1, Math.min(5, config.maxDifficulty)) as Difficulty,
  };
  for (const player of room.players) {
    player.ready = false;
  }
}

export function roomToJSON(room: Room) {
  return {
    id: room.id,
    state: room.state,
    players: room.players,
    stages: room.stages,
    seed: room.seed,
    createdAt: room.createdAt,
    config: room.config,
  };
}
