import { useState, useMemo } from "react";
import type { StageProps } from "../types/game.ts";
import { seededRandom, shuffleArray } from "../utils/random.ts";

const CATEGORIES = [
  { label: "faces", prompt: "Select all faces", items: ["😀","😃","😄","😁","😆","😎","🤓","🥳","🤩","😇","😂","🥰","😍","😋","🤗","😏","🤔","😴"] },
  { label: "animals", prompt: "Select all animals", items: ["🐶","🐱","🐭","🐰","🐻","🐼","🐸","🦊","🐵","🐔","🐧","🐢","🐍","🦋","🐝","🐞","🐳","🦄"] },
  { label: "food", prompt: "Select all food", items: ["🍎","🍐","🍊","🍌","🍉","🍇","🍕","🍔","🌮","🍩","🍪","🧁","🍰","🍣","🥐","🍟","🌭","🥑"] },
  { label: "vehicles", prompt: "Select all vehicles", items: ["🚗","🚕","🚙","🚌","🏎️","🚓","🚑","🚒","🚲","✈️","🚀","🛵","🚁","⛵","🚂","🚇","🛻","🚜"] },
  { label: "plants", prompt: "Select all plants", items: ["🌵","🌲","🌳","🌴","🌱","🌿","🌺","🌻","🌹","🌷","🌼","🌸","🍀","🎋","🍁","🌾","🪴","🎄"] },
  { label: "sports", prompt: "Select all sports", items: ["⚽","🏀","🏈","⚾","🎾","🏐","🏓","🏸","🎱","⛳","🏹","🥊","🏒","🎣","🛹","🏋️","⛷️","🤿"] },
] as const;

function getGridConfig(difficulty: number) {
  if (difficulty >= 4) return { cols: 4, total: 16 };
  return { cols: 3, total: 9 };
}

function getTargetCount(difficulty: number) {
  const counts: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 6 };
  return counts[difficulty] ?? 2;
}

export function CaptchaStage({ difficulty, seed, onSubmit }: StageProps) {
  const puzzle = useMemo(() => {
    const rand = seededRandom(seed);
    const { total } = getGridConfig(difficulty);
    const targetCount = getTargetCount(difficulty);

    const targetIdx = Math.floor(rand() * CATEGORIES.length);
    const target = CATEGORIES[targetIdx]!;

    const distractorCategories = CATEGORIES.filter((_, i) => i !== targetIdx);

    const targetItems = shuffleArray([...target.items], rand).slice(0, targetCount);

    const distractorPool: string[] = [];
    for (const cat of distractorCategories) {
      distractorPool.push(...cat.items);
    }
    const distractors = shuffleArray(distractorPool, rand).slice(0, total - targetCount);

    const cells = shuffleArray(
      [
        ...targetItems.map((emoji) => ({ emoji, correct: true })),
        ...distractors.map((emoji) => ({ emoji, correct: false })),
      ],
      rand,
    );

    return { prompt: target.prompt, cells, targetCount };
  }, [difficulty, seed]);

  const [selected, setSelected] = useState<Set<number>>(() => new Set());

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSubmit = () => {
    const correct = puzzle.cells.every(
      (cell, i) => cell.correct === selected.has(i),
    );
    onSubmit(correct);
  };

  const { cols } = getGridConfig(difficulty);

  return (
    <div className="flex-col gap-md">
      <p className="stage-prompt">{puzzle.prompt} ({selected.size}/{puzzle.targetCount})</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${String(cols)}, 1fr)`,
          gap: "8px",
          width: "min(360px, 100%)",
        }}
      >
        {puzzle.cells.map((cell, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className="crayon-btn edgefx"
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              aspectRatio: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: selected.has(i) ? "var(--accent, #b8d8ba)" : "#e8e0d0",
              outline: selected.has(i) ? "3px solid var(--accent-dark, #6a9b6c)" : "none",
              cursor: "pointer",
              transition: "background 0.15s, outline 0.15s",
            }}
          >
            {cell.emoji}
          </button>
        ))}
      </div>
      <button className="crayon-btn primary edgefx" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}
