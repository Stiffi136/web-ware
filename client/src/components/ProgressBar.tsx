import { useGame } from "../context/GameContext.tsx";

const PLAYER_COLORS = ["#ff8f6b", "#75c7ff", "#9ddf78", "#ffb5d4", "#ffe36a", "#cc88ff", "#ff6699", "#44cccc"];

export function ProgressBar() {
  const { state } = useGame();
  const room = state.room;
  if (!room) return null;

  const totalStages = room.stages.length;
  if (totalStages === 0) return null;

  return (
    <div className="crayon-card edgefx" style={{ background: "rgba(255,255,255,0.6)", padding: "10px 16px" }}>
      <div className="progress-track edgefx" style={{ height: 22 }}>
        {room.players.map((p, i) => {
          const pct = totalStages > 0 ? (p.currentStage / totalStages) * 100 : 0;
          return (
            <div
              key={p.id}
              className="progress-marker"
              title={p.name}
              style={{
                left: `${String(Math.min(pct, 100))}%`,
                background: PLAYER_COLORS[i % PLAYER_COLORS.length],
                zIndex: p.id === state.playerId ? 10 : 1,
                width: p.id === state.playerId ? 16 : 12,
                height: p.id === state.playerId ? 16 : 12,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
