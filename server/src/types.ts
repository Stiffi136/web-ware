import type { ServerWebSocket } from "bun";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type Player = {
  id: string;
  name: string;
  ready: boolean;
  score: number;
  currentStage: number;
  finished: boolean;
};

export type RoomState = "lobby" | "countdown" | "playing" | "results";

export type StageConfig = {
  type: string;
  difficulty: Difficulty;
  seed: number;
};

export type StageResult = {
  playerId: string;
  stageIndex: number;
  timeMs: number;
  success: boolean;
};

export type Room = {
  id: string;
  state: RoomState;
  players: Player[];
  stages: StageConfig[];
  seed: number;
  createdAt: number;
  stageResults: Map<number, StageResult[]>;
  stageStartTimes: Map<string, number>; // playerId -> timestamp when current stage started
  countdownTimer: ReturnType<typeof setTimeout> | null;
};

export type WSData = {
  playerId: string;
  roomId: string;
};

export type GameSocket = ServerWebSocket<WSData>;

// Client -> Server
export type ClientMessage =
  | { event: "join"; roomId: string; playerName: string }
  | { event: "ready"; ready: boolean }
  | { event: "stage-complete"; stageIndex: number; timeMs: number; success: boolean }
  | { event: "rematch" };
