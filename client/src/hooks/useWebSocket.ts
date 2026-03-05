import { useEffect, useRef, useCallback } from "react";
import { useGame } from "../context/GameContext.tsx";
import type { ClientMessage, ServerMessage } from "../types/protocol.ts";

function getWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL as string;
  }
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}/ws`;
}

export function useWebSocket() {
  const { dispatch } = useGame();
  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<ClientMessage[]>([]);

  useEffect(() => {
    const url = getWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.addEventListener("open", () => {
      for (const msg of queueRef.current) {
        ws.send(JSON.stringify(msg));
      }
      queueRef.current = [];
    });

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
      // Only clear ref if this is still the active WebSocket
      // (Strict Mode: first WS close event fires after second mount sets wsRef)
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    });

    return () => {
      ws.close();
      wsRef.current = null;
      queueRef.current = [];
    };
  }, [dispatch]);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      // Queue message until connection is open
      queueRef.current.push(msg);
    }
  }, []);

  return { send };
}
