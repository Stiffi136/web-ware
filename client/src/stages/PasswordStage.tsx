import { useState, useMemo, useRef } from "react";
import type { StageProps } from "../types/game.ts";
import { seededRandom, shuffleArray, pickRandom } from "../utils/random.ts";

type Rule = { label: string; test: (pw: string) => boolean };
type Token = { id: string; text: string };

const UPPER = ["Star", "Moon", "Fire", "Jazz", "Blue", "Sage", "Nova", "Wave"];
const LOWER = ["fish", "wolf", "cave", "mint", "dusk", "reef", "frog", "haze"];
const SYMS = ["!", "?", "#", ".", "$"];
const DECOYS = [
  "oops", "nope", "null", "meh", "000", "13", "~", "&", "99", "void", "0", "^",
];

function buildPuzzle(difficulty: number, rand: () => number) {
  const parts: string[] = [];

  // always: capitalized word
  const w1 = pickRandom(UPPER, rand);
  parts.push(w1);

  // always: 2-digit number
  const n1 = String(Math.floor(rand() * 90) + 10);
  parts.push(n1);

  // difficulty >= 2: lowercase word
  let w2 = "";
  if (difficulty >= 2) {
    w2 = pickRandom(LOWER, rand);
    parts.push(w2);
  }

  // difficulty >= 3: single digit
  if (difficulty >= 3) {
    parts.push(String(Math.floor(rand() * 9) + 1));
  }

  // difficulty >= 4: second lowercase word
  if (difficulty >= 4) {
    parts.push(pickRandom(LOWER.filter((w) => w !== w2), rand));
  }

  // always: trailing symbol
  const sym = pickRandom(SYMS, rand);
  parts.push(sym);

  const solution = parts.join("");

  /* ---------- rules, scaling with difficulty ---------- */
  const rules: Rule[] = [];

  // content rules (order-independent)
  rules.push({
    label: "Contains an uppercase letter",
    test: (pw) => /[A-Z]/.test(pw),
  });

  if (difficulty >= 1) {
    rules.push({
      label: `Must include "${n1}"`,
      test: (pw) => pw.includes(n1),
    });
  }

  // ordering rule (max 1 position constraint)
  if (difficulty >= 4) {
    rules.push({
      label: `"${n1}" must directly follow "${w1}"`,
      test: (pw) => pw.includes(w1 + n1),
    });
  } else if (difficulty >= 2) {
    rules.push({
      label: `Must start with "${w1}"`,
      test: (pw) => pw.startsWith(w1),
    });
  }

  if (difficulty >= 3) {
    rules.push({
      label: `Must end with "${sym}"`,
      test: (pw) => pw.endsWith(sym),
    });
    const dc = (solution.match(/\d/g) ?? []).length;
    rules.push({
      label: `Exactly ${String(dc)} digits`,
      test: (pw) => (pw.match(/\d/g) ?? []).length === dc,
    });
  }

  /* ---------- decoys ---------- */
  const numDecoys = Math.min(difficulty + 1, 6);
  const safe = DECOYS.filter((d) => !parts.includes(d));
  const decoys = shuffleArray([...safe], rand).slice(0, numDecoys);

  const tokens: Token[] = shuffleArray(
    [
      ...parts.map((t, i) => ({ id: `p${i}`, text: t })),
      ...decoys.map((t, i) => ({ id: `d${i}`, text: t })),
    ],
    rand,
  );

  return { tokens, rules };
}

export function PasswordStage({ difficulty, seed, onSubmit }: StageProps) {
  const { tokens, rules } = useMemo(
    () => buildPuzzle(difficulty, seededRandom(seed)),
    [difficulty, seed],
  );

  const [placed, setPlaced] = useState<Token[]>([]);
  const [preview, setPreview] = useState<{ ghostId: string; idx: number } | null>(null);
  const dragSrc = useRef<{ zone: "tray" | "builder"; id: string; idx: number } | null>(null);

  const available = tokens.filter((t) => !placed.some((p) => p.id === t.id));
  const password = placed.map((t) => t.text).join("");

  // Compute preview placement for ghost
  const previewResult = useMemo(() => {
    if (!preview) return null;
    const src = dragSrc.current;
    if (!src) return null;

    if (src.zone === "tray") {
      const tok = tokens.find((t) => t.id === preview.ghostId);
      if (!tok) return null;
      const next = [...placed];
      next.splice(preview.idx, 0, tok);
      return { items: next, ghostIdx: preview.idx };
    } else {
      const next = [...placed];
      const [moved] = next.splice(src.idx, 1);
      const targetIdx = preview.idx > src.idx ? preview.idx - 1 : preview.idx;
      next.splice(targetIdx, 0, moved!);
      return { items: next, ghostIdx: targetIdx };
    }
  }, [preview, placed, tokens]);

  const displayPlaced = previewResult?.items ?? placed;
  const ghostIdx = previewResult?.ghostIdx ?? -1;
  const displayPassword = displayPlaced.map((t) => t.text).join("");

  const ruleResults = rules.map((r) => ({
    label: r.label,
    passed: r.test(displayPassword),
  }));
  const allPassed = rules.every((r) => r.test(password));

  /* ---- drag helpers ---- */
  const onTrayDragStart = (tok: Token) => {
    dragSrc.current = { zone: "tray", id: tok.id, idx: -1 };
  };

  const onBuilderDragStart = (tok: Token, idx: number) => {
    dragSrc.current = { zone: "builder", id: tok.id, idx };
  };

  const onDragEnd = () => {
    setPreview(null);
    dragSrc.current = null;
  };

  const onBuilderDrop = (targetIdx: number) => {
    const src = dragSrc.current;
    if (!src) return;

    if (src.zone === "tray") {
      const tok = tokens.find((t) => t.id === src.id);
      if (!tok) return;
      setPlaced((prev) => {
        const next = [...prev];
        next.splice(targetIdx, 0, tok);
        return next;
      });
    } else {
      // reorder within builder
      if (src.idx === targetIdx) return;
      setPlaced((prev) => {
        const next = [...prev];
        const [moved] = next.splice(src.idx, 1);
        next.splice(targetIdx > src.idx ? targetIdx - 1 : targetIdx, 0, moved!);
        return next;
      });
    }
    setPreview(null);
    dragSrc.current = null;
  };

  const onBuilderEndDrop = () => {
    const src = dragSrc.current;
    if (!src || src.zone !== "tray") return;
    const tok = tokens.find((t) => t.id === src.id);
    if (!tok) return;
    setPlaced((prev) => [...prev, tok]);
    setPreview(null);
    dragSrc.current = null;
  };

  const onTrayDrop = () => {
    const src = dragSrc.current;
    if (!src || src.zone !== "builder") return;
    setPlaced((prev) => prev.filter((p) => p.id !== src.id));
    setPreview(null);
    dragSrc.current = null;
  };

  const clearPreview = () => setPreview(null);

  const chipStyle = (bg: string): React.CSSProperties => ({
    background: bg,
    padding: "6px 14px",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "grab",
    border: "2px solid var(--ink)",
    userSelect: "none",
    fontSize: "1rem",
    whiteSpace: "nowrap",
  });

  return (
    <div className="flex-col gap-md">
      <p className="stage-prompt">Build a valid password</p>

      <div
        className="crayon-card"
        style={{ background: "var(--blue)", width: "min(480px, 100%)" }}
      >
        {/* Rules */}
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px" }}>
          {ruleResults.map((r, i) => (
            <li
              key={i}
              style={{
                padding: "4px 0",
                fontWeight: 700,
                color: r.passed ? "#2a7d2a" : "var(--ink)",
                textDecoration: r.passed ? "line-through" : "none",
                opacity: r.passed ? 0.6 : 1,
              }}
            >
              {r.passed ? "OK" : "X"} {r.label}
            </li>
          ))}
        </ul>

        {/* Password builder (drop zone) */}
        <div
          className="input-frame edgefx"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            const src = dragSrc.current;
            if (src) {
              setPreview({ ghostId: src.id, idx: placed.length });
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              clearPreview();
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            onBuilderEndDrop();
          }}
          style={{
            minHeight: 52,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "8px 10px",
            alignItems: "center",
          }}
        >
          {displayPlaced.length === 0 && !preview && (
            <span style={{ opacity: 0.35, fontStyle: "italic", pointerEvents: "none" }}>
              Drag blocks here to build password…
            </span>
          )}
          {displayPlaced.map((tok, idx) => {
            const isGhost = idx === ghostIdx;
            return (
              <span
                key={`${tok.id}-${idx}`}
                draggable={!isGhost}
                onDragStart={(e) => {
                  if (isGhost) { e.preventDefault(); return; }
                  e.dataTransfer.effectAllowed = "move";
                  onBuilderDragStart(tok, idx);
                }}
                onDragEnd={onDragEnd}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "move";
                  const src = dragSrc.current;
                  if (src) {
                    setPreview({ ghostId: src.id, idx });
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBuilderDrop(idx);
                }}
                style={{
                  ...chipStyle("var(--yellow)"),
                  ...(isGhost ? { opacity: 0.4, borderStyle: "dashed" } : {}),
                }}
              >
                {tok.text}
              </span>
            );
          })}
        </div>

        {/* Live preview */}
        {displayPassword && (
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "1.05rem",
              fontWeight: 700,
              margin: "8px 0 0",
              wordBreak: "break-all",
              textAlign: "center",
              opacity: preview ? 0.45 : 0.7,
            }}
          >
            {displayPassword}
          </p>
        )}

        {/* Token tray */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            // Clear builder preview when dragging back to tray
            if (preview) clearPreview();
          }}
          onDrop={(e) => {
            e.preventDefault();
            onTrayDrop();
          }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 14,
            justifyContent: "center",
            minHeight: 40,
            padding: 6,
            borderRadius: 10,
            border: "2px dashed rgba(0,0,0,0.15)",
          }}
        >
          {available.length === 0 && (
            <span style={{ opacity: 0.3, fontStyle: "italic", pointerEvents: "none" }}>
              Drag blocks back here to remove
            </span>
          )}
          {available.map((tok) => {
            const isDragging = preview !== null && dragSrc.current?.zone === "tray" && dragSrc.current.id === tok.id;
            return (
              <span
                key={tok.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  onTrayDragStart(tok);
                }}
                onDragEnd={onDragEnd}
                style={{
                  ...chipStyle("var(--white)"),
                  ...(isDragging ? { opacity: 0.3 } : {}),
                }}
              >
                {tok.text}
              </span>
            );
          })}
        </div>
      </div>

      <button className="crayon-btn primary edgefx" onClick={() => onSubmit(allPassed)}>
        Submit
      </button>
    </div>
  );
}
