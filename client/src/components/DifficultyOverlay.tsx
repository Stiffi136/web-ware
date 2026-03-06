import { useEffect, useRef } from "react";
import { ANNOUNCER_BOOST } from "../hooks/useAudio.ts";

type Props = {
  difficulty: number;
  onDone: () => void;
  playSfx: (src: string, boost?: number) => void;
  duckMusic: (factor: number) => void;
};

export function DifficultyOverlay({ difficulty, onDone, playSfx, duckMusic }: Props) {
  const onDoneRef = useRef(onDone);
  const duckMusicRef = useRef(duckMusic);
  onDoneRef.current = onDone;
  duckMusicRef.current = duckMusic;

  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const played = useRef(false);
  useEffect(() => {
    if (!played.current) {
      played.current = true;
      duckMusicRef.current(0.35);
      const idx = Math.floor(Math.random() * 3) + 1;
      playSfxRef.current(`/audio/difficulty-increase-${String(idx)}.mp3`, ANNOUNCER_BOOST);
    }
    const timer = setTimeout(() => {
      duckMusicRef.current(1);
      onDoneRef.current();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="countdown-overlay">
      <div className="difficulty-text" key={difficulty}>
        Level {difficulty}
      </div>
    </div>
  );
}
