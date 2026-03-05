import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext.tsx";
import { useWebSocket } from "../hooks/useWebSocket.ts";
import { useAudio } from "../hooks/useAudio.ts";
import { LobbyView } from "../components/LobbyView.tsx";
import { GameView } from "../components/GameView.tsx";
import { ResultsView } from "../components/ResultsView.tsx";
import { CountdownOverlay } from "../components/CountdownOverlay.tsx";

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { state } = useGame();
  const { send } = useWebSocket();
  const audio = useAudio();
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!state.playerName) {
      navigate("/");
      return;
    }
    if (joinedRef.current) return;
    joinedRef.current = true;
    send({
      event: "join",
      roomId: roomId === "new" ? "" : (roomId ?? ""),
      playerName: state.playerName,
    });
  }, [roomId, state.playerName, send, navigate]);

  // Update URL when server assigns room ID
  useEffect(() => {
    if (state.room && roomId !== state.room.id) {
      navigate(`/room/${state.room.id}`, { replace: true });
    }
  }, [state.room, roomId, navigate]);

  // Audio: play music during game, adjust speed
  const prevStateRef = useRef<string>("");
  useEffect(() => {
    const roomState = state.room?.state;
    if (!roomState) return;
    if (roomState === "playing" && prevStateRef.current !== "playing") {
      audio.playMusic(1.0);
    }
    if (roomState === "playing" && state.room) {
      // Get current player's stage to determine difficulty
      const me = state.room.players.find((p) => p.id === state.playerId);
      if (me) {
        const currentStage = state.room.stages[me.currentStage];
        if (currentStage) {
          const rate = 1.0 + (currentStage.difficulty - 1) * 0.1;
          audio.setPlaybackRate(rate);
        }
      }
    }
    if (roomState === "results" && prevStateRef.current === "playing") {
      audio.stopMusic();
      audio.playSfx("/audio/finish-whistle.mp3");
    }
    prevStateRef.current = roomState;
  }, [state.room?.state, state.room, state.playerId, audio]);

  // Countdown SFX
  useEffect(() => {
    if (state.countdown === 3) audio.playSfx("/audio/three.mp3");
    if (state.countdown === 2) audio.playSfx("/audio/two.mp3");
    if (state.countdown === 1) audio.playSfx("/audio/one.mp3");
  }, [state.countdown, audio]);

  if (!state.room) {
    return (
      <div className="page" style={{ justifyContent: "center", alignItems: "center", minHeight: "100dvh" }}>
        <div className="crayon-card" style={{ background: "var(--yellow)", textAlign: "center" }}>
          <p className="label">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {state.countdown > 0 && <CountdownOverlay seconds={state.countdown} />}
      {state.room.state === "lobby" && <LobbyView send={send} audio={audio} />}
      {state.room.state === "countdown" && <LobbyView send={send} audio={audio} />}
      {state.room.state === "playing" && <GameView send={send} />}
      {state.room.state === "results" && <ResultsView send={send} />}
    </>
  );
}
