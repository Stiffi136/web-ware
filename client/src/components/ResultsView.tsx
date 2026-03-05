import { useGame } from "../context/GameContext.tsx";
import type { ClientMessage } from "../types/protocol.ts";

type Props = {
  send: (msg: ClientMessage) => void;
};

const MEDALS = ["1st", "2nd", "3rd"];

export function ResultsView({ send }: Props) {
  const { state } = useGame();
  const room = state.room!;
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const isSinglePlayer = room.players.length === 1;

  const handleRematch = () => {
    send({ event: "rematch" });
  };

  return (
    <div className="page" style={{ alignItems: "center" }}>
      <div
        className="crayon-card"
        style={{ background: "var(--yellow)", textAlign: "center", maxWidth: 480, width: "100%", transform: "rotate(-0.3deg)" }}
      >
        <h1 className="crayon-title" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: 12 }}>
          {isSinglePlayer ? "FINISHED!" : "RESULTS"}
        </h1>
        {!isSinglePlayer && sorted.length > 0 && (
          <p style={{ fontWeight: 900, fontSize: "1.2rem", margin: "0 0 8px" }}>
            Winner: {sorted[0]!.name}!
          </p>
        )}
      </div>

      <div className="crayon-card" style={{ background: "var(--green)", maxWidth: 480, width: "100%", transform: "rotate(0.2deg)" }}>
        <ul className="rank-list">
          {sorted.map((p, i) => (
            <li key={p.id} className="rank-item">
              <span className="rank-position">
                {i < 3 ? MEDALS[i] : `${String(i + 1)}th`}
              </span>
              <span className="rank-name">
                {p.name}
                {p.id === state.playerId ? " (you)" : ""}
              </span>
              <span className="rank-score">{p.score} pts</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        className="crayon-btn primary edgefx"
        onClick={handleRematch}
        style={{ minWidth: 200 }}
      >
        Rematch
      </button>
    </div>
  );
}
