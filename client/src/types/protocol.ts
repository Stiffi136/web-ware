import type { Player, Room, StageConfig, StageResult } from "./game.ts";

// Client -> Server
export type ClientMessage =
  | { event: "join"; roomId: string; playerName: string }
  | { event: "ready"; ready: boolean }
  | { event: "stage-complete"; stageIndex: number; timeMs: number; success: boolean }
  | { event: "rematch" };

// Server -> Client
export type ServerMessage =
  | { event: "room-state"; room: Room; playerId: string }
  | { event: "player-joined"; player: Player }
  | { event: "player-left"; playerId: string }
  | { event: "player-ready"; playerId: string; ready: boolean }
  | { event: "countdown"; seconds: number }
  | { event: "game-start"; stages: StageConfig[]; seed: number }
  | { event: "player-progress"; playerId: string; stageIndex: number }
  | { event: "stage-result"; stageIndex: number; results: StageResult[] }
  | { event: "game-end"; rankings: Player[] }
  | { event: "error"; message: string };
