import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { stageRegistry, stageNames } from "../stages/registry.ts";
import type { Difficulty } from "../types/game.ts";

export function DevPage() {
  const { stageType, difficulty: diffParam } = useParams<{
    stageType?: string;
    difficulty?: string;
  }>();
  const navigate = useNavigate();

  const stageKeys = Object.keys(stageRegistry);
  const [selectedStage, setSelectedStage] = useState(stageType ?? stageKeys[0] ?? "");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(
    (Number(diffParam) || 1) as Difficulty,
  );
  const [seedInput, setSeedInput] = useState("42");
  const [resetKey, setResetKey] = useState(0);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    timeMs: number;
  } | null>(null);
  const [startTime] = useState(() => Date.now());

  const handleSubmit = useCallback(
    (success: boolean) => {
      setLastResult({ success, timeMs: Date.now() - startTime });
    },
    [startTime],
  );

  const handleGo = () => {
    navigate(`/dev/${selectedStage}/${String(selectedDifficulty)}`);
    setLastResult(null);
    setResetKey((k) => k + 1);
  };

  const handleReset = () => {
    setLastResult(null);
    setResetKey((k) => k + 1);
  };

  const StageComponent = stageType ? stageRegistry[stageType] : null;
  const seed = Number(seedInput) || 42;

  return (
    <div className="page">
      <div
        className="crayon-card"
        style={{ background: "var(--pink)", transform: "rotate(-0.3deg)" }}
      >
        <h1 className="crayon-title" style={{ fontSize: "1.8rem", marginBottom: 12 }}>
          DEV MODE
        </h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="label">Stage</label>
            <select
              className="crayon-input"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
            >
              {stageKeys.map((k) => (
                <option key={k} value={k}>
                  {stageNames[k] ?? k}
                </option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 100 }}>
            <label className="label">Difficulty</label>
            <input
              className="crayon-input"
              type="range"
              min={1}
              max={5}
              value={selectedDifficulty}
              onChange={(e) =>
                setSelectedDifficulty(Number(e.target.value) as Difficulty)
              }
            />
            <div style={{ textAlign: "center", fontWeight: 900 }}>
              {selectedDifficulty}
            </div>
          </div>
          <div style={{ minWidth: 80 }}>
            <label className="label">Seed</label>
            <input
              className="crayon-input"
              type="number"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              style={{ width: 80 }}
            />
          </div>
          <button className="crayon-btn primary edgefx" onClick={handleGo}>
            Go
          </button>
          <button className="crayon-btn alt edgefx" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {lastResult && (
        <div
          className="crayon-card"
          style={{
            background: lastResult.success ? "var(--green)" : "var(--orange)",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: 900, fontSize: "1.2rem", margin: 0 }}>
            {lastResult.success ? "SUCCESS" : "FAILED"} &mdash;{" "}
            {lastResult.timeMs}ms
          </p>
        </div>
      )}

      {StageComponent && !lastResult && (
        <StageComponent
          key={resetKey}
          difficulty={selectedDifficulty}
          seed={seed}
          onSubmit={handleSubmit}
        />
      )}

      {!stageType && (
        <div className="crayon-card" style={{ background: "var(--yellow)", textAlign: "center" }}>
          <p style={{ fontWeight: 700 }}>
            Select a stage and click Go to start testing.
          </p>
        </div>
      )}
    </div>
  );
}
