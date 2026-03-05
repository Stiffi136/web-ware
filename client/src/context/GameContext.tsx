import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { Player, Room, GameConfig, StageConfig, StageResult } from "../types/game.ts";

type GameState = {
  playerId: string;
  playerName: string;
  room: Room | null;
  countdown: number;
  stageResults: Map<number, StageResult[]>;
  currentStageStartTime: number;
};

type GameAction =
  | { type: "set-name"; name: string }
  | { type: "room-state"; room: Room; playerId: string }
  | { type: "player-joined"; player: Player }
  | { type: "player-left"; playerId: string }
  | { type: "player-ready"; playerId: string; ready: boolean }
  | { type: "countdown"; seconds: number }
  | { type: "game-start"; stages: StageConfig[]; seed: number }
  | { type: "player-progress"; playerId: string; stageIndex: number }
  | { type: "stage-result"; stageIndex: number; results: StageResult[] }
  | { type: "game-end"; rankings: Player[] }
  | { type: "config-changed"; config: GameConfig }
  | { type: "reset-stage-timer" }
  | { type: "reset" };

const initialState: GameState = {
  playerId: "",
  playerName: "",
  room: null,
  countdown: 0,
  stageResults: new Map(),
  currentStageStartTime: 0,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "set-name":
      return { ...state, playerName: action.name };

    case "room-state": {
      const playerId = action.playerId || state.playerId;
      return {
        ...state,
        room: action.room,
        playerId,
        countdown: 0,
        stageResults: new Map(),
      };
    }

    case "player-joined": {
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          players: [...state.room.players, action.player],
        },
      };
    }

    case "player-left": {
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          players: state.room.players.filter((p) => p.id !== action.playerId),
        },
      };
    }

    case "player-ready": {
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          players: state.room.players.map((p) =>
            p.id === action.playerId ? { ...p, ready: action.ready } : p,
          ),
        },
      };
    }

    case "config-changed": {
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          config: action.config,
          players: state.room.players.map((p) => ({ ...p, ready: false })),
        },
      };
    }

    case "countdown":
      return {
        ...state,
        countdown: action.seconds,
        room: state.room ? { ...state.room, state: "countdown" } : null,
      };

    case "game-start": {
      if (!state.room) return state;
      return {
        ...state,
        countdown: 0,
        currentStageStartTime: Date.now(),
        room: {
          ...state.room,
          state: "playing",
          stages: action.stages,
          seed: action.seed,
          players: state.room.players.map((p) => ({
            ...p,
            currentStage: 0,
            finished: false,
            score: 0,
            ready: false,
          })),
        },
      };
    }

    case "player-progress": {
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          players: state.room.players.map((p) =>
            p.id === action.playerId
              ? {
                  ...p,
                  currentStage: action.stageIndex,
                  finished: action.stageIndex >= state.room!.stages.length,
                }
              : p,
          ),
        },
      };
    }

    case "stage-result": {
      const results = new Map(state.stageResults);
      results.set(action.stageIndex, action.results);
      // Update scores from results
      if (!state.room) return { ...state, stageResults: results };
      const successful = action.results
        .filter((r) => r.success)
        .sort((a, b) => a.timeMs - b.timeMs);
      const winnerId = successful.length > 0 ? successful[0]!.playerId : null;
      return {
        ...state,
        stageResults: results,
        room: {
          ...state.room,
          players: state.room.players.map((p) =>
            p.id === winnerId ? { ...p, score: p.score + 1 } : p,
          ),
        },
      };
    }

    case "game-end": {
      if (!state.room) return state;
      return {
        ...state,
        room: {
          ...state.room,
          state: "results",
          players: action.rankings,
        },
      };
    }

    case "reset-stage-timer":
      return { ...state, currentStageStartTime: Date.now() };

    case "reset":
      return { ...initialState, playerName: state.playerName };

    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within GameProvider");
  }
  return ctx;
}
