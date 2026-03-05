import { useCallback, useState } from "react";
import { useGame } from "../context/GameContext.tsx";
import { stageRegistry, stageNames } from "../stages/registry.ts";
import { ProgressBar } from "./ProgressBar.tsx";
import { Scoreboard } from "./Scoreboard.tsx";
import { FeedbackOverlay } from "./FeedbackOverlay.tsx";
import type { ClientMessage } from "../types/protocol.ts";

type Props = {
  send: (msg: ClientMessage) => void;
  playSfx: (src: string) => void;
};

export function GameView({ send, playSfx }: Props) {
  const { state, dispatch } = useGame();
  const room = state.room!;
  const me = room.players.find((p) => p.id === state.playerId);
  const stageIndex = me?.currentStage ?? 0;
  const stageConfig = room.stages[stageIndex];
  const [feedback, setFeedback] = useState<{ result: "correct" | "incorrect"; timeMs: number } | null>(null);

  const handleSubmit = useCallback(
    (success: boolean) => {
      const timeMs = Date.now() - state.currentStageStartTime;
      setFeedback({ result: success ? "correct" : "incorrect", timeMs });
      send({
        event: "stage-complete",
        stageIndex,
        timeMs,
        success,
      });
      dispatch({ type: "reset-stage-timer" });
    },
    [stageIndex, state.currentStageStartTime, send, dispatch],
  );

  if (!stageConfig || me?.finished) {
    return (
      <div className="page" style={{ alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
        <ProgressBar />
        <div className="crayon-card" style={{ background: "var(--green)", textAlign: "center", maxWidth: 400 }}>
          <h2 className="crayon-title" style={{ fontSize: "2rem" }}>Done!</h2>
          <p style={{ fontWeight: 700 }}>Waiting for other players...</p>
        </div>
        <Scoreboard />
      </div>
    );
  }

  const StageComponent = stageRegistry[stageConfig.type];
  if (!StageComponent) {
    return <div>Unknown stage: {stageConfig.type}</div>;
  }

  return (
    <div className="page">
      {feedback && (
        <FeedbackOverlay
          result={feedback.result}
          timeMs={feedback.timeMs}
          onDone={() => setFeedback(null)}
          playSfx={playSfx}
        />
      )}
      <ProgressBar />
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <span style={{ fontWeight: 700, opacity: 0.6, fontSize: "0.9rem" }}>
          Stage {stageIndex + 1}/{room.stages.length} &mdash; {stageNames[stageConfig.type] ?? stageConfig.type} (Lv.{stageConfig.difficulty})
        </span>
      </div>
      <StageComponent
        key={`${stageConfig.type}-${String(stageIndex)}`}
        difficulty={stageConfig.difficulty}
        seed={stageConfig.seed}
        onSubmit={handleSubmit}
      />
      <Scoreboard />
    </div>
  );
}
