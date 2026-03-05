import { useGame } from "../context/GameContext.tsx";
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

  const toggleReady = () => {
    send({ event: "ready", ready: !isReady });
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
