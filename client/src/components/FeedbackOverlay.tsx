import { useEffect, useRef } from "react";

type Props = {
  result: "correct" | "incorrect";
  timeMs: number;
  onDone: () => void;
  playSfx: (src: string) => void;
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const remainingMs = ms % 1000;
  const s = String(totalSeconds).padStart(2, "0");
  const m = String(remainingMs).padStart(3, "0");
  return `${s}s ${m}ms`;
}

export function FeedbackOverlay({ result, timeMs, onDone, playSfx }: Props) {
  const onDoneRef = useRef(onDone);
  const playSfxRef = useRef(playSfx);
  onDoneRef.current = onDone;
  playSfxRef.current = playSfx;

  useEffect(() => {
    playSfxRef.current(`/audio/${result}.mp3`);
    const duration = result === "correct" ? 900 : 700;
    const timer = setTimeout(() => onDoneRef.current(), duration);
    return () => clearTimeout(timer);
  }, [result]);

  return (
    <div className="countdown-overlay">
      <div className={`feedback-text feedback-${result}`} key={result}>
        {result === "correct" ? "Correct!" : "Incorrect"}
        {result === "correct" && (
          <div className="feedback-time">{formatTime(timeMs)}</div>
        )}
      </div>
    </div>
  );
}
