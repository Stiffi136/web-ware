import { useState, useMemo, useCallback } from "react";
import type { StageProps } from "../types/game.ts";
import { seededRandom, pickRandom, shuffleArray } from "../utils/random.ts";

const AD_TITLES = [
  "Congratulations!",
  "SPECIAL OFFER",
  "You Won!",
  "Act Now!",
  "Limited Time!",
  "FREE Download",
  "Hot Deal!",
  "Warning!",
  "Urgent!",
  "Exclusive!",
  "VIP Access",
  "Last Chance!",
];

const AD_BODIES = [
  "You are the 1,000,000th visitor! Claim your prize now!",
  "Your computer has 47 viruses! Click here to clean!",
  "Singles in your area want to meet you!",
  "Lose 20kg in 5 days with this one weird trick!",
  "Your Flash Player is out of date! Update now!",
  "Congratulations! You've been selected for a free iPhone!",
  "WARNING: Your PC is running slow! Fix it now!",
  "Make $5000/day working from home!",
  "Doctors HATE this simple trick!",
  "Click here to claim your free gift card!",
  "Your subscription is about to expire!",
  "Download our FREE toolbar for faster browsing!",
  "You have (1) unread message from a friend!",
  "Your system needs an urgent security update!",
  "Spin the wheel to win amazing prizes!",
];

const AD_BUTTON_LABELS = [
  "CLAIM NOW",
  "Download",
  "OK",
  "Yes!",
  "Accept",
  "Continue",
  "GET IT FREE",
  "Install",
  "Learn More",
  "Try Now",
  "Start",
  "Open",
];

const AD_COLORS = [
  { bg: "#1a1a2e", header: "#e94560", accent: "#ff6b6b" },
  { bg: "#fff3e0", header: "#e65100", accent: "#ff9800" },
  { bg: "#e8f5e9", header: "#2e7d32", accent: "#4caf50" },
  { bg: "#e3f2fd", header: "#1565c0", accent: "#2196f3" },
  { bg: "#fce4ec", header: "#c62828", accent: "#ef5350" },
  { bg: "#f3e5f5", header: "#6a1b9a", accent: "#ab47bc" },
  { bg: "#fff8e1", header: "#f57f17", accent: "#ffca28" },
  { bg: "#efebe9", header: "#4e342e", accent: "#8d6e63" },
];

type Popup = {
  id: number;
  title: string;
  body: string;
  buttonLabel: string;
  x: number;
  y: number;
  width: number;
  height: number;
  closeCorner: "left" | "right";
  colors: (typeof AD_COLORS)[number];
  zBase: number;
  hasImage: boolean;
  imageEmoji: string;
};

const DECOY_EMOJIS = [
  "🎁", "🏆", "💰", "🎯", "🔥", "💎", "🎪", "🎰", "⚡", "🌟",
];

function generatePopups(difficulty: number, rand: () => number): Popup[] {
  const count = 1 + difficulty * 2; // 3, 5, 7, 9, 11
  const popups: Popup[] = [];

  for (let i = 0; i < count; i++) {
    const colors = pickRandom(AD_COLORS, rand);
    const minW = 200;
    const maxW = 280;
    const width = minW + Math.floor(rand() * (maxW - minW));
    const height = 140 + Math.floor(rand() * 80);

    // Position popups so they overlap but close buttons remain reachable
    const x = Math.floor(rand() * (100 - 40)) + 2; // 2% to ~62% (percentage-based)
    const y = Math.floor(rand() * (100 - 40)) + 2;

    popups.push({
      id: i,
      title: pickRandom(AD_TITLES, rand),
      body: pickRandom(AD_BODIES, rand),
      buttonLabel: pickRandom(AD_BUTTON_LABELS, rand),
      x,
      y,
      width,
      height,
      closeCorner: rand() < 0.5 ? "left" : "right",
      colors,
      zBase: i,
      hasImage: rand() < 0.4,
      imageEmoji: pickRandom(DECOY_EMOJIS, rand),
    });
  }

  return shuffleArray(popups, rand);
}

export function AdPopupStage({ difficulty, seed, onSubmit }: StageProps) {
  const popups = useMemo(
    () => generatePopups(difficulty, seededRandom(seed)),
    [difficulty, seed],
  );

  const [closedIds, setClosedIds] = useState<Set<number>>(new Set());
  const [failed, setFailed] = useState(false);

  const closeSize = Math.max(18, 30 - difficulty * 3); // 27, 24, 21, 18, 15 -> clamped to 18

  const handleClose = useCallback(
    (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (failed) return;
      const next = new Set(closedIds);
      next.add(id);
      setClosedIds(next);

      if (next.size === popups.length) {
        onSubmit(true);
      }
    },
    [closedIds, popups.length, onSubmit, failed],
  );

  const handlePopupClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (failed) return;
      setFailed(true);
      onSubmit(false);
    },
    [onSubmit, failed],
  );

  const remaining = popups.length - closedIds.size;

  return (
    <div className="flex-col gap-md">
      <p className="stage-prompt">
        Close all popups using the <strong>X</strong> button ({remaining}{" "}
        remaining). Don't click on the ad!
      </p>

      <div
        style={{
          position: "relative",
          width: "min(640px, 100%)",
          height: 420,
          background: "#c8c0b0",
          borderRadius: 8,
          overflow: "hidden",
          border: "2px solid #a89880",
        }}
      >
        {/* Fake desktop background elements */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#b8b0a0",
            fontSize: "0.8rem",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          My Desktop
        </div>

        {popups.map((popup) => {
          if (closedIds.has(popup.id)) return null;

          return (
            <div
              key={popup.id}
              onClick={handlePopupClick}
              style={{
                position: "absolute",
                left: `${String(popup.x)}%`,
                top: `${String(popup.y)}%`,
                width: popup.width,
                zIndex: popup.zBase + 10,
                borderRadius: 6,
                overflow: "hidden",
                boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                cursor: "pointer",
                userSelect: "none",
                border: "1px solid rgba(0,0,0,0.2)",
              }}
            >
              {/* Header bar with close button */}
              <div
                style={{
                  background: popup.colors.header,
                  color: "#fff",
                  padding: "6px 8px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  flexDirection:
                    popup.closeCorner === "left" ? "row" : "row-reverse",
                  gap: 6,
                  minHeight: 28,
                }}
              >
                <button
                  onClick={(e) => handleClose(popup.id, e)}
                  style={{
                    width: closeSize,
                    height: closeSize,
                    minWidth: closeSize,
                    minHeight: closeSize,
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 3,
                    color: "#fff",
                    fontSize: Math.max(10, closeSize - 8),
                    fontWeight: 900,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    lineHeight: 1,
                    fontFamily: "inherit",
                    flexShrink: 0,
                  }}
                >
                  X
                </button>
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign:
                      popup.closeCorner === "left" ? "right" : "left",
                  }}
                >
                  {popup.title}
                </span>
              </div>

              {/* Body */}
              <div
                style={{
                  background: popup.colors.bg,
                  padding: "10px 12px",
                  fontSize: "0.8rem",
                  lineHeight: 1.4,
                  color: "#333",
                }}
              >
                {popup.hasImage && (
                  <div
                    style={{
                      fontSize: "2rem",
                      textAlign: "center",
                      marginBottom: 6,
                    }}
                  >
                    {popup.imageEmoji}
                  </div>
                )}
                <p style={{ margin: "0 0 10px" }}>{popup.body}</p>
                <div style={{ textAlign: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      background: popup.colors.accent,
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "6px 20px",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      fontFamily: "inherit",
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}
                  >
                    {popup.buttonLabel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
