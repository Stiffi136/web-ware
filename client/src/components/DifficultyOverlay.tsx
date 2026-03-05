import { useEffect, useRef } from "react";

type Props = {
  difficulty: number;
  onDone: () => void;
  volume: number;
  duckMusic: (factor: number) => void;
};

const BASE_URL = import.meta.env.BASE_URL;

export function DifficultyOverlay({ difficulty, onDone, volume, duckMusic }: Props) {
  const onDoneRef = useRef(onDone);
  const duckMusicRef = useRef(duckMusic);
  onDoneRef.current = onDone;
  duckMusicRef.current = duckMusic;

  const played = useRef(false);
  useEffect(() => {
    if (!played.current) {
      played.current = true;
      duckMusicRef.current(0.15);
      const idx = Math.floor(Math.random() * 3) + 1;
      const sfx = new Audio(`${BASE_URL}audio/difficulty-increase-${String(idx)}.mp3`);
      sfx.volume = Math.min(volume * 2.25, 1);
      setTimeout(() => sfx.play().catch(() => {}), 500);
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
