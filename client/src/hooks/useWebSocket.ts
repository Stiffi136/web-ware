import { useEffect, useRef, useCallback } from "react";
import { useGame } from "../context/GameContext.tsx";
import type { ClientMessage, ServerMessage } from "../types/protocol.ts";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:3001/ws";

export function useWebSocket() {
  const { dispatch } = useGame();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(String(e.data)) as ServerMessage;
      switch (msg.event) {
        case "room-state":
          dispatch({ type: "room-state", room: msg.room, playerId: msg.playerId });
          break;
        case "player-joined":
          dispatch({ type: "player-joined", player: msg.player });
          break;
        case "player-left":
          dispatch({ type: "player-left", playerId: msg.playerId });
          break;
        case "player-ready":
          dispatch({ type: "player-ready", playerId: msg.playerId, ready: msg.ready });
          break;
        case "countdown":
          dispatch({ type: "countdown", seconds: msg.seconds });
          break;
        case "game-start":
          dispatch({ type: "game-start", stages: msg.stages, seed: msg.seed });
          break;
        case "player-progress":
          dispatch({ type: "player-progress", playerId: msg.playerId, stageIndex: msg.stageIndex });
          break;
        case "stage-result":
          dispatch({ type: "stage-result", stageIndex: msg.stageIndex, results: msg.results });
          break;
        case "game-end":
          dispatch({ type: "game-end", rankings: msg.rankings });
          break;
      }
    });

    ws.addEventListener("close", () => {
      wsRef.current = null;
    });

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [dispatch]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send };
}
