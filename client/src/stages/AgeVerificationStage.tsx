import { useState, useMemo } from "react";
import type { StageProps } from "../types/game.ts";
import { seededRandom, pickRandom } from "../utils/random.ts";

const MIN_AGES = [6, 12, 16, 18, 21] as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TODAY = { year: 2026, month: 3, day: 5 };

type Constraint = {
  minAge: number;
  maxAge: number | null;
  monthRule: string | null;
  yearRule: string | null;
};

function buildConstraint(difficulty: number, rand: () => number): Constraint {
  const minAge = pickRandom(MIN_AGES, rand);

  let maxAge: number | null = null;
  if (difficulty >= 2) {
    const ranges: Record<number, [number, number]> = {
      2: [60, 120],
      3: [40, 90],
      4: [30, 65],
      5: [25, 45],
    };
    const [lo, hi] = ranges[difficulty]!;
    maxAge = lo + Math.floor(rand() * (hi - lo + 1));
    if (maxAge <= minAge) maxAge = minAge + 5;
  }

  let monthRule: string | null = null;
  if (difficulty >= 3) {
    if (difficulty === 5) {
      const forbiddenMonth = Math.floor(rand() * 12);
      monthRule = `not-month-${String(forbiddenMonth)}`;
    } else {
      monthRule = rand() < 0.5 ? "not-even-month" : "not-odd-month";
    }
  }

  let yearRule: string | null = null;
  if (difficulty >= 4) {
    yearRule = rand() < 0.5 ? "not-even-year" : "not-odd-year";
  }

  return { minAge, maxAge, monthRule, yearRule };
}

function describeConstraints(c: Constraint): string[] {
  const lines: string[] = [];
  lines.push(`Minimum age: ${String(c.minAge)} years`);
  if (c.maxAge !== null) lines.push(`Maximum age: ${String(c.maxAge)} years`);
  if (c.monthRule === "not-even-month") lines.push("Not born in an even month");
  else if (c.monthRule === "not-odd-month") lines.push("Not born in an odd month");
  else if (c.monthRule?.startsWith("not-month-")) {
    const idx = Number(c.monthRule.split("-")[2]);
    lines.push(`Not born in ${MONTH_NAMES[idx]!}`);
  }
  if (c.yearRule === "not-even-year") lines.push("Not born in an even year");
  else if (c.yearRule === "not-odd-year") lines.push("Not born in an odd year");
  return lines;
}

function validateDate(
  year: number,
  month: number,
  day: number,
  c: Constraint,
): boolean {
  const maxDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDay) return false;

  let age = TODAY.year - year;
  if (TODAY.month < month || (TODAY.month === month && TODAY.day < day)) {
    age--;
  }

  if (age < c.minAge) return false;
  if (c.maxAge !== null && age > c.maxAge) return false;

  if (c.monthRule === "not-even-month" && month % 2 === 0) return false;
  if (c.monthRule === "not-odd-month" && month % 2 !== 0) return false;
  if (c.monthRule?.startsWith("not-month-")) {
    const forbidden = Number(c.monthRule.split("-")[2]) + 1;
    if (month === forbidden) return false;
  }

  if (c.yearRule === "not-even-year" && year % 2 === 0) return false;
  if (c.yearRule === "not-odd-year" && year % 2 !== 0) return false;

  return true;
}

export function AgeVerificationStage({ difficulty, seed, onSubmit }: StageProps) {
  const constraint = useMemo(() => {
    const rand = seededRandom(seed);
    return buildConstraint(difficulty, rand);
  }, [difficulty, seed]);

  const [day, setDay] = useState("1");
  const [month, setMonth] = useState("1");
  const [year, setYear] = useState("2026");

  const handleSubmit = () => {
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);
    if (!d || !m || !y || m < 1 || m > 12 || y < 1900) {
      onSubmit(false);
      return;
    }
    onSubmit(validateDate(y, m, d, constraint));
  };

  const rules = describeConstraints(constraint);

  return (
    <div className="flex-col gap-md">
      <p className="stage-prompt">Age Verification</p>
      <div
        className="crayon-card edgefx"
        style={{
          padding: "1.2rem",
          width: "min(380px, 100%)",
          display: "flex",
          flexDirection: "column",
          gap: "0.8rem",
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: "0.2rem" }}>
          Enter a valid date of birth:
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.95rem" }}>
          {rules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>

        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <div className="flex-col" style={{ alignItems: "center", flex: 1 }}>
            <label style={{ fontSize: "0.8rem" }}>Day</label>
            <select
              className="input-frame"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              style={{ width: "100%", textAlign: "center", maxHeight: "200px" }}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={String(d)}>{String(d)}</option>
              ))}
            </select>
          </div>
          <div className="flex-col" style={{ alignItems: "center", flex: 1.2 }}>
            <label style={{ fontSize: "0.8rem" }}>Month</label>
            <select
              className="input-frame"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ width: "100%", textAlign: "center", maxHeight: "200px" }}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={String(i + 1)}>{name}</option>
              ))}
            </select>
          </div>
          <div className="flex-col" style={{ alignItems: "center", flex: 1.5 }}>
            <label style={{ fontSize: "0.8rem" }}>Year</label>
            <select
              className="input-frame"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{ width: "100%", textAlign: "center", maxHeight: "200px" }}
            >
              {Array.from({ length: 127 }, (_, i) => 2026 - i).map((y) => (
                <option key={y} value={String(y)}>{String(y)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button className="crayon-btn primary edgefx" onClick={handleSubmit}>
        Verify
      </button>
    </div>
  );
}
