import { useGame } from "../context/GameContext.tsx";

export function Scoreboard() {
  const { state } = useGame();
  const room = state.room;
  if (!room || room.players.length <= 1) return null;

  const sorted = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className="scoreboard">
      {sorted.map((p) => (
        <div
          key={p.id}
          className={`score-chip ${p.id === state.playerId ? "me" : ""}`}
        >
          {p.name}: {p.score}
        </div>
      ))}
    </div>
  );
}
