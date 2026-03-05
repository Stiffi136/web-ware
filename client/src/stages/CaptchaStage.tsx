import { useState, useMemo } from "react";
import type { StageProps } from "../types/game.ts";
import { seededRandom } from "../utils/random.ts";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
const DISTRACTORS = ["!@#$%", "Il1|", "O0Oo"];

export function CaptchaStage({ difficulty, seed, onSubmit }: StageProps) {
  const captchaText = useMemo(() => {
    const rand = seededRandom(seed);
    const len = 4 + difficulty;
    let text = "";
    for (let i = 0; i < len; i++) {
      if (difficulty >= 3 && rand() < 0.2) {
        const d = DISTRACTORS[Math.floor(rand() * DISTRACTORS.length)]!;
        text += d[Math.floor(rand() * d.length)];
      } else {
        text += CHARS[Math.floor(rand() * CHARS.length)];
      }
    }
    return text;
  }, [difficulty, seed]);

  const [input, setInput] = useState("");

  const handleSubmit = () => {
    onSubmit(input === captchaText);
  };

  const rotation = useMemo(() => {
    const rand = seededRandom(seed + 99);
    return captchaText.split("").map(() => (rand() - 0.5) * difficulty * 8);
  }, [captchaText, difficulty, seed]);

  const distortion = Math.min(difficulty * 0.3, 1.5);

  return (
    <div className="flex-col gap-md" style={{ alignItems: "center" }}>
      <p className="stage-prompt">Type the captcha</p>
      <div
        className="crayon-card"
        style={{
          background: "#e8e0d0",
          padding: "20px 28px",
          userSelect: "none",
          textAlign: "center",
          filter: `url(#crayon) blur(${String(distortion)}px)`,
          transform: `rotate(${String((difficulty - 3) * 0.5)}deg)`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: "2px" }}>
          {captchaText.split("").map((ch, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontSize: `clamp(1.8rem, 4vw, 2.8rem)`,
                fontWeight: 900,
                fontFamily: "monospace",
                transform: `rotate(${String(rotation[i])}deg) translateY(${String(Math.sin(i) * difficulty * 2)}px)`,
                textDecoration: difficulty >= 4 ? "line-through" : undefined,
                opacity: 0.7 + Math.random() * 0.3,
              }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
      <div className="input-frame edgefx" style={{ width: "min(320px, 100%)" }}>
        <input
          className="crayon-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Type here..."
          autoFocus
          autoComplete="off"
        />
      </div>
      <button className="crayon-btn primary edgefx" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}
