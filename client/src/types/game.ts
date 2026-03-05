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

export type Room = {
  id: string;
  state: RoomState;
  players: Player[];
  stages: StageConfig[];
  seed: number;
  createdAt: number;
};

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

export type StageProps = {
  difficulty: Difficulty;
  seed: number;
  onSubmit: (success: boolean) => void;
};
