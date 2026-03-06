import { useGame } from "../context/GameContext.tsx";
import { stageNames } from "../stages/registry.ts";

function formatTime(ms: number): string {
  return (ms / 1000).toFixed(2) + "s";
}

const RANK_POINTS: Record<number, number> = { 1: 3, 2: 2, 3: 1 };

export function Scoreboard() {
  const { state } = useGame();
  const room = state.room;
  if (!room || room.stages.length === 0) return null;

  const playerMap = new Map(room.players.map((p) => [p.id, p.name]));
  const completedStages: number[] = [];
  for (let i = 0; i < room.stages.length; i++) {
    if (state.stageResults.has(i)) {
      completedStages.push(i);
    }
  }

  if (completedStages.length === 0) return null;

  return (
    <div className="stage-scoreboard">
      <div className="stage-scoreboard-title">Scoreboard</div>
      <div className="stage-scoreboard-list">
        {completedStages.map((stageIdx) => {
          const stageConfig = room.stages[stageIdx]!;
          const results = state.stageResults.get(stageIdx) ?? [];
          const sorted = [...results]
            .filter((r) => r.success)
            .sort((a, b) => a.timeMs - b.timeMs);

          // Top 3 entries
          const top3 = sorted.slice(0, 3);
          // Find own result
          const myResult = results.find((r) => r.playerId === state.playerId);
          const myRank = sorted.findIndex((r) => r.playerId === state.playerId);

          // Build display entries: top 3 + own (if not in top 3)
          type Entry = { rank: number; name: string; timeMs: number; isMe: boolean };
          const entries: Entry[] = top3.map((r, i) => ({
            rank: i + 1,
            name: playerMap.get(r.playerId) ?? "???",
            timeMs: r.timeMs,
            isMe: r.playerId === state.playerId,
          }));

          // Add own entry if not already in top 3
          if (myResult && myRank >= 3) {
            entries.push({
              rank: myResult.success ? myRank + 1 : -1,
              name: playerMap.get(myResult.playerId) ?? "???",
              timeMs: myResult.timeMs,
              isMe: true,
            });
          }

          const stageName = stageNames[stageConfig.type] ?? stageConfig.type;

          return (
            <div key={stageIdx} className="stage-scoreboard-stage">
              <div className="stage-scoreboard-stage-header">
                {stageIdx + 1}. {stageName}
              </div>
              {entries.map((e, i) => {
                // Podium colors for top 3 (including own entry)
                let podiumClass = "";
                if (e.rank === 1) podiumClass = "gold";
                else if (e.rank === 2) podiumClass = "silver";
                else if (e.rank === 3) podiumClass = "bronze";
                return (
                  <div
                    key={`${String(stageIdx)}-${String(i)}`}
                    className={`stage-scoreboard-entry ${podiumClass} ${e.isMe ? "me" : ""}`}
                  >
                    <span className="stage-scoreboard-rank">
                      {e.rank > 0 ? `#${String(e.rank)}` : "-"}
                    </span>
                    <span className="stage-scoreboard-name">
                      {e.isMe ? `${e.name} (you)` : e.name}
                    </span>
                    <span className="stage-scoreboard-time">
                      {formatTime(e.timeMs)}
                    </span>
                    {e.isMe && RANK_POINTS[e.rank] && (
                      <span className="stage-scoreboard-pts">
                        +{RANK_POINTS[e.rank]}pts
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
