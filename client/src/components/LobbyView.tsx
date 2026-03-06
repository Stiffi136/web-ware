import { useGame } from "../context/GameContext.tsx";
import type { Difficulty } from "../types/game.ts";
import type { ClientMessage } from "../types/protocol.ts";

type Props = {
  send: (msg: ClientMessage) => void;
  audio: { volume: number; setVolume: (v: number) => void };
};

export function LobbyView({ send, audio }: Props) {
  const { state } = useGame();
  const room = state.room!;
  const me = room.players.find((p) => p.id === state.playerId);
  const isReady = me?.ready ?? false;
  const config = room.config;

  const totalStages = config.stagesPerDifficulty * config.maxDifficulty;
  const estimatedMinutes = Math.round((totalStages * 10) / 60);

  const toggleReady = () => {
    send({ event: "ready", ready: !isReady });
  };

  const updateConfig = (partial: { stagesPerDifficulty?: number; maxDifficulty?: Difficulty }) => {
    send({ event: "config-change", config: { ...config, ...partial } });
  };

  return (
    <div className="page" style={{ alignItems: "center" }}>
      <div
        className="crayon-card"
        style={{
          background: "var(--orange)",
          textAlign: "center",
          maxWidth: 480,
          width: "100%",
          transform: "rotate(-0.3deg)",
        }}
      >
        <h1 className="crayon-title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: 8 }}>
          ROOM {room.id}
        </h1>
        <p style={{ margin: 0, fontWeight: 700, opacity: 0.8 }}>
          Share this code with your friends!
        </p>
      </div>

      <div
        className="crayon-card"
        style={{ background: "var(--blue)", maxWidth: 480, width: "100%", transform: "rotate(0.2deg)" }}
      >
        <p className="label">Players ({room.players.length})</p>
        <ul className="player-list">
          {room.players.map((p) => (
            <li key={p.id} className="player-item">
              <span>
                {p.name}
                {p.id === state.playerId ? " (you)" : ""}
              </span>
              <span className={`ready-dot ${p.ready ? "is-ready" : ""}`} />
            </li>
          ))}
        </ul>
      </div>

      <div
        className="crayon-card"
        style={{ background: "var(--green)", maxWidth: 480, width: "100%", transform: "rotate(0.3deg)" }}
      >
        <p className="label">Game Settings</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 4, fontSize: "0.9rem" }}>
              Max Difficulty
            </label>
            <select
              value={config.maxDifficulty}
              onChange={(e) => updateConfig({ maxDifficulty: Number(e.target.value) as Difficulty })}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: "1rem",
                borderRadius: 6,
                border: "2px solid rgba(0,0,0,0.2)",
                background: "rgba(255,255,255,0.7)",
              }}
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>Level {d}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 4, fontSize: "0.9rem" }}>
              Stages per Difficulty
            </label>
            <select
              value={config.stagesPerDifficulty}
              onChange={(e) => updateConfig({ stagesPerDifficulty: Number(e.target.value) })}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: "1rem",
                borderRadius: 6,
                border: "2px solid rgba(0,0,0,0.2)",
                background: "rgba(255,255,255,0.7)",
              }}
            >
              {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <p style={{ margin: 0, fontWeight: 700, textAlign: "center", fontSize: "0.95rem" }}>
          {totalStages} Stages ~ {estimatedMinutes} {estimatedMinutes === 1 ? "Minute" : "Minutes"}
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          className={`crayon-btn edgefx ${isReady ? "green" : "primary"}`}
          onClick={toggleReady}
          style={{ minWidth: 160 }}
        >
          {isReady ? "Ready!" : "Ready Up"}
        </button>
      </div>

      <div
        className="crayon-card"
        style={{ background: "var(--pink)", maxWidth: 300, width: "100%", transform: "rotate(-0.4deg)" }}
      >
        <p className="label">Volume</p>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={audio.volume}
          onChange={(e) => audio.setVolume(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}
