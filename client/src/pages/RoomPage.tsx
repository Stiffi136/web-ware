import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext.tsx";
import { useWebSocket } from "../hooks/useWebSocket.ts";
import { useAudio, ANNOUNCER_BOOST } from "../hooks/useAudio.ts";
import { LobbyView } from "../components/LobbyView.tsx";
import { GameView } from "../components/GameView.tsx";
import { ResultsView } from "../components/ResultsView.tsx";
import { CountdownOverlay } from "../components/CountdownOverlay.tsx";
import { VolumeSlider } from "../components/VolumeSlider.tsx";

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { state } = useGame();
  const { send } = useWebSocket();
  const audio = useAudio();
  // Capture roomId at mount time so URL updates don't re-trigger join
  const initialRoomId = useRef(roomId);
  useEffect(() => {
    if (!state.playerName) {
      navigate("/");
      return;
    }
    const rid = initialRoomId.current;
    send({
      event: "join",
      roomId: rid === "new" ? "" : (rid ?? ""),
      playerName: state.playerName,
    });
  }, [state.playerName, send, navigate]);

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
      audio.playSfx("/audio/finish.mp3", ANNOUNCER_BOOST);
    }
    prevStateRef.current = roomState;
  }, [state.room?.state, state.room, state.playerId, audio]);

  // Countdown SFX
  useEffect(() => {
    if (state.countdown === 3) audio.playSfx("/audio/three.mp3", ANNOUNCER_BOOST);
    if (state.countdown === 2) audio.playSfx("/audio/two.mp3", ANNOUNCER_BOOST);
    if (state.countdown === 1) audio.playSfx("/audio/one.mp3", ANNOUNCER_BOOST);
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
      {state.room.state === "playing" && <GameView send={send} playSfx={audio.playSfx} duckMusic={audio.duckMusic} />}
      {state.room.state === "results" && <ResultsView send={send} />}
      <VolumeSlider volume={audio.volume} setVolume={audio.setVolume} />
    </>
  );
}
