import { useState, useMemo } from "react";
import type { StageProps } from "../types/game.ts";
import { seededRandom, shuffleArray, pickRandom } from "../utils/random.ts";

type Field = {
  id: string;
  label: string;
  expected: string;
};

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Quinn", "Sage"];
const LAST_NAMES = ["Smith", "Rivera", "Chen", "Kim", "Patel", "Garcia", "Novak", "Ali"];
const CITIES = ["Berlin", "Tokyo", "Lagos", "Lima", "Oslo", "Cairo", "Seoul", "Rome"];

function makeFields(difficulty: number, rand: () => number): Field[] {
  const firstName = pickRandom(FIRST_NAMES, rand);
  const lastName = pickRandom(LAST_NAMES, rand);
  const city = pickRandom(CITIES, rand);
  const base: Field[] = [
    { id: "first", label: "First Name", expected: firstName },
    { id: "last", label: "Last Name", expected: lastName },
  ];

  const extra: Field[] = [
    { id: "email", label: "Email", expected: `${firstName.toLowerCase()}@mail.com` },
    { id: "city", label: "City", expected: city },
    { id: "phone", label: "Phone", expected: `+${String(Math.floor(rand() * 90) + 10)} ${String(Math.floor(rand() * 9000000) + 1000000)}` },
    { id: "zip", label: "ZIP Code", expected: String(Math.floor(rand() * 90000) + 10000) },
  ];

  const shuffled = shuffleArray(extra, rand);
  return [...base, ...shuffled.slice(0, difficulty)];
}

export function DataFormStage({ difficulty, seed, onSubmit }: StageProps) {
  const fields = useMemo(() => makeFields(difficulty, seededRandom(seed)), [difficulty, seed]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const update = (id: string, val: string) => {
    setValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = () => {
    const allCorrect = fields.every((f) => (values[f.id] ?? "") === f.expected);
    onSubmit(allCorrect);
  };

  return (
    <div className="flex-col gap-md">
      <p className="stage-prompt">Fill in the form via Drag & Drop</p>
      <div
        className="crayon-card"
        style={{ background: "var(--green)", width: "min(460px, 100%)" }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.5)",
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 12,
            fontWeight: 700,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {fields.map((f) => {
            const filled = values[f.id] === f.expected;
            return (
              <span
                key={f.id}
                draggable={!filled}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", f.expected);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                style={{
                  background: filled ? "rgba(0,0,0,0.12)" : "var(--white)",
                  padding: "4px 10px",
                  borderRadius: 8,
                  cursor: filled ? "default" : "grab",
                  opacity: filled ? 0.45 : 1,
                  fontSize: "0.9rem",
                  textDecoration: filled ? "line-through" : "none",
                  transition: "opacity 0.15s, background 0.15s",
                }}
              >
                {f.label}: {f.expected}
              </span>
            );
          })}
        </div>
        <div className="flex-col" style={{ gap: 8, alignItems: "stretch" }}>
          {fields.map((f) => (
            <div
              key={f.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                setDropTargetId(f.id);
              }}
              onDragLeave={() => setDropTargetId(null)}
              onDrop={(e) => {
                e.preventDefault();
                update(f.id, e.dataTransfer.getData("text/plain"));
                setDropTargetId(null);
              }}
              style={{
                outline: dropTargetId === f.id ? "2px solid var(--white)" : "none",
                borderRadius: 8,
                transition: "outline 0.1s",
              }}
            >
              <label style={{ fontWeight: 700, fontSize: "0.9rem" }}>{f.label}</label>
              <div
                className="crayon-input"
                style={{
                  minHeight: 38,
                  display: "flex",
                  alignItems: "center",
                  cursor: "default",
                  opacity: values[f.id] ? 1 : 0.4,
                  fontStyle: values[f.id] ? "normal" : "italic",
                }}
              >
                {values[f.id] || "Drop here…"}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="crayon-btn primary edgefx" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}
