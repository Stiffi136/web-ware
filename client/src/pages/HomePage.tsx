import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext.tsx";

export function HomePage() {
  const { state, dispatch } = useGame();
  const [name, setName] = useState(state.playerName);
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const canProceed = name.trim().length > 0;

  const handleCreate = () => {
    if (!canProceed) return;
    dispatch({ type: "set-name", name: name.trim() });
    // Navigate to a random room (server will assign real ID)
    navigate(`/room/new`);
  };

  const handleJoin = () => {
    if (!canProceed || !roomCode.trim()) return;
    dispatch({ type: "set-name", name: name.trim() });
    navigate(`/room/${roomCode.trim().toUpperCase()}`);
  };

  return (
    <div className="page" style={{ justifyContent: "center", alignItems: "center", minHeight: "100dvh" }}>
      <div className="crayon-card" style={{ background: "var(--orange)", transform: "rotate(-0.5deg)", textAlign: "center", maxWidth: 480, width: "100%" }}>
        <div className="banner-frame edgefx" style={{ borderWidth: 4 }}>
          <img src="/img/banner.png" alt="WebWare" className="banner-img crayon-ink" />
        </div>
        <h1 className="crayon-title" style={{ fontSize: "clamp(2.4rem, 7vw, 4rem)", marginBottom: 16 }}>
          WEBWARE
        </h1>
      </div>

      <div className="crayon-card" style={{ background: "var(--blue)", maxWidth: 480, width: "100%", transform: "rotate(0.3deg)" }}>
        <p className="label">Your Name</p>
        <div className="input-frame edgefx" style={{ marginBottom: 16 }}>
          <input
            className="crayon-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canProceed) handleCreate();
            }}
            placeholder="Enter your name..."
            maxLength={20}
            autoFocus
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="crayon-btn primary edgefx"
            onClick={handleCreate}
            disabled={!canProceed}
            style={{ flex: 1 }}
          >
            Create Room
          </button>
        </div>

        <div style={{ margin: "16px 0 0", borderTop: "2px dashed rgba(0,0,0,0.2)", paddingTop: 14 }}>
          <p className="label">Or Join a Room</p>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="input-frame edgefx" style={{ flex: 1 }}>
              <input
                className="crayon-input"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoin();
                }}
                placeholder="Room code..."
                maxLength={8}
                style={{ textTransform: "uppercase" }}
              />
            </div>
            <button
              className="crayon-btn green edgefx"
              onClick={handleJoin}
              disabled={!canProceed || !roomCode.trim()}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
