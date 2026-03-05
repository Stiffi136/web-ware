import { useMemo } from "react";
import type { StageProps } from "../types/game.ts";
import { seededRandom } from "../utils/random.ts";

const FAKE_LABELS = [
  "DOWNLOAD NOW",
  "FREE Download",
  "Click Here!",
  "GET IT NOW",
  "DOWNLOAD",
  "Start Download",
  "Download (Safe)",
  "Fast Download",
  "Mirror Link",
  "Download v2.0",
  "HD DOWNLOAD",
  "Premium Download",
];

const AD_TEXTS = [
  "Your PC is slow! Click to fix!",
  "Congratulations! You won!",
  "Install our toolbar!",
  "Speed up your browser!",
  "Hot singles in your area!",
  "Free virus scan!",
  "Update your Flash Player!",
  "YOU are the 1000th visitor!",
  "Clean your registry NOW",
  "WARNING: 3 threats found!",
];

const COLORS = [
  "#ff4444", "#44aa44", "#4488ff", "#ff8800", "#aa44ff",
  "#ff6699", "#44cccc", "#ffcc00", "#cc4400", "#6644ff",
];

type FakeButton = {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  bg: string;
  rotation: number;
  fontSize: number;
  isReal: boolean;
  isAd: boolean;
  adText?: string;
};

export function DownloadButtonStage({ difficulty, seed, onSubmit }: StageProps) {
  const buttons = useMemo(() => {
    const rand = seededRandom(seed);
    const count = 3 + difficulty * 3;
    const result: FakeButton[] = [];
    const realIdx = Math.floor(rand() * count);

    for (let i = 0; i < count; i++) {
      const isReal = i === realIdx;
      const isAd = !isReal && rand() < 0.3;
      result.push({
        label: isReal
          ? "Download"
          : FAKE_LABELS[Math.floor(rand() * FAKE_LABELS.length)]!,
        x: rand() * 80 + 2,
        y: rand() * 80 + 2,
        w: 100 + rand() * (isReal ? 40 : 120),
        h: 30 + rand() * (isReal ? 10 : 30),
        bg: isReal
          ? "#44aa44"
          : COLORS[Math.floor(rand() * COLORS.length)]!,
        rotation: isReal ? 0 : (rand() - 0.5) * difficulty * 4,
        fontSize: isReal
          ? 14
          : 10 + Math.floor(rand() * (difficulty * 4)),
        isReal,
        isAd,
        adText: isAd
          ? AD_TEXTS[Math.floor(rand() * AD_TEXTS.length)]
          : undefined,
      });
    }
    return result;
  }, [difficulty, seed]);

  return (
    <div className="flex-col gap-md" style={{ alignItems: "center" }}>
      <p className="stage-prompt">
        Find this button:{" "}
        <span
          style={{
            display: "inline-block",
            background: "#44aa44",
            color: "#fff",
            border: "2px solid #2a7d2a",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 900,
            padding: "4px 16px",
            fontFamily: "inherit",
            textShadow: "1px 1px 0 rgba(0,0,0,0.3)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            verticalAlign: "middle",
          }}
        >
          Download
        </span>
      </p>
      <div
        className="crayon-card"
        style={{
          background: "#e8e0d0",
          width: "min(600px, 100%)",
          minHeight: 400,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {buttons.map((btn, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${String(btn.x)}%`,
              top: `${String(btn.y)}%`,
              transform: `rotate(${String(btn.rotation)}deg)`,
            }}
          >
            {btn.isAd && btn.adText && (
              <div
                style={{
                  background: "rgba(255,255,0,0.8)",
                  padding: "2px 6px",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 4,
                  marginBottom: 2,
                  whiteSpace: "nowrap",
                }}
              >
                {btn.adText}
              </div>
            )}
            <button
              onClick={() => onSubmit(btn.isReal)}
              style={{
                width: btn.w,
                height: btn.h,
                background: btn.bg,
                color: "#fff",
                border: btn.isReal ? "2px solid #2a7d2a" : "1px solid rgba(0,0,0,0.2)",
                borderRadius: btn.isReal ? 8 : Math.floor(seededRandom(seed + i)() * 12),
                fontSize: btn.fontSize,
                fontWeight: 900,
                cursor: "pointer",
                fontFamily: "inherit",
                textShadow: "1px 1px 0 rgba(0,0,0,0.3)",
                boxShadow: btn.isAd
                  ? "0 0 8px rgba(255,0,0,0.4)"
                  : "0 2px 4px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {btn.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
