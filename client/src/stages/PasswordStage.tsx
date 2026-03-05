import { useState, useMemo } from "react";
import type { StageProps } from "../types/game.ts";
import { seededRandom, pickRandom } from "../utils/random.ts";

type Rule = { label: string; test: (pw: string) => boolean };

const ALL_RULES: ((rand: () => number) => Rule)[] = [
  () => ({
    label: "At least 8 characters",
    test: (pw) => pw.length >= 8,
  }),
  () => ({
    label: "Contains an uppercase letter",
    test: (pw) => /[A-Z]/.test(pw),
  }),
  () => ({
    label: "Contains a number",
    test: (pw) => /\d/.test(pw),
  }),
  () => ({
    label: "Contains a special character (!@#$%)",
    test: (pw) => /[!@#$%^&*]/.test(pw),
  }),
  (rand) => {
    const n = Math.floor(rand() * 8) + 2;
    return {
      label: `Contains exactly ${String(n)} digits`,
      test: (pw) => (pw.match(/\d/g) ?? []).length === n,
    };
  },
  () => ({
    label: "No spaces allowed",
    test: (pw) => !pw.includes(" "),
  }),
  (rand) => {
    const words = ["fish", "moon", "blue", "star", "cake", "fire", "jazz", "pixel"];
    const word = pickRandom(words, rand);
    return {
      label: `Must include the word "${word}"`,
      test: (pw) => pw.toLowerCase().includes(word),
    };
  },
  () => ({
    label: "Starts with a capital letter",
    test: (pw) => pw.length > 0 && pw[0] === pw[0]!.toUpperCase() && /[A-Z]/.test(pw[0]!),
  }),
  () => ({
    label: "Ends with a punctuation mark (. ! ?)",
    test: (pw) => /[.!?]$/.test(pw),
  }),
  (rand) => {
    const min = Math.floor(rand() * 6) + 10;
    return {
      label: `At least ${String(min)} characters long`,
      test: (pw) => pw.length >= min,
    };
  },
];

export function PasswordStage({ difficulty, seed, onSubmit }: StageProps) {
  const rules = useMemo(() => {
    const rand = seededRandom(seed);
    const count = 1 + difficulty;
    const pool = [...ALL_RULES];
    const picked: Rule[] = [];
    for (let i = 0; i < count && pool.length > 0; i++) {
      const idx = Math.floor(rand() * pool.length);
      picked.push(pool.splice(idx, 1)[0]!(rand));
    }
    return picked;
  }, [difficulty, seed]);

  const [password, setPassword] = useState("");

  const ruleResults = rules.map((r) => ({
    label: r.label,
    passed: r.test(password),
  }));

  const allPassed = ruleResults.every((r) => r.passed);

  const handleSubmit = () => {
    onSubmit(allPassed);
  };

  return (
    <div className="flex-col gap-md" style={{ alignItems: "center" }}>
      <p className="stage-prompt">Create a valid password</p>
      <div
        className="crayon-card"
        style={{ background: "var(--blue)", width: "min(420px, 100%)" }}
      >
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
        <div className="input-frame edgefx">
          <input
            className="crayon-input"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="Enter password..."
            autoFocus
            autoComplete="off"
          />
        </div>
      </div>
      <button className="crayon-btn primary edgefx" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}
