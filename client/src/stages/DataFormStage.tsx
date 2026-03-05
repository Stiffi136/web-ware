import { useState, useMemo } from "react";
import type { StageProps } from "../types/game.ts";
import { seededRandom, shuffleArray, pickRandom } from "../utils/random.ts";

type Field = {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "date" | "select";
  options?: string[];
  expected: string;
};

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Quinn", "Sage"];
const LAST_NAMES = ["Smith", "Rivera", "Chen", "Kim", "Patel", "Garcia", "Novak", "Ali"];
const CITIES = ["Berlin", "Tokyo", "Lagos", "Lima", "Oslo", "Cairo", "Seoul", "Rome"];
const COUNTRIES = ["Germany", "Japan", "Nigeria", "Peru", "Norway", "Egypt", "South Korea", "Italy"];
const COLORS = ["Red", "Blue", "Green", "Yellow", "Purple"];

function makeFields(difficulty: number, rand: () => number): Field[] {
  const firstName = pickRandom(FIRST_NAMES, rand);
  const lastName = pickRandom(LAST_NAMES, rand);
  const city = pickRandom(CITIES, rand);
  const country = pickRandom(COUNTRIES, rand);

  const base: Field[] = [
    { id: "first", label: "First Name", type: "text", expected: firstName },
    { id: "last", label: "Last Name", type: "text", expected: lastName },
  ];

  const extra: Field[] = [
    { id: "email", label: "Email", type: "email", expected: `${firstName.toLowerCase()}@mail.com` },
    { id: "city", label: "City", type: "text", expected: city },
    { id: "country", label: "Country", type: "select", options: shuffleArray([...COUNTRIES], rand), expected: country },
    { id: "phone", label: "Phone", type: "tel", expected: `+${String(Math.floor(rand() * 90) + 10)} ${String(Math.floor(rand() * 9000000) + 1000000)}` },
    { id: "zip", label: "ZIP Code", type: "text", expected: String(Math.floor(rand() * 90000) + 10000) },
    { id: "color", label: "Favorite Color", type: "select", options: COLORS, expected: pickRandom(COLORS, rand) },
    { id: "dob", label: "Date of Birth", type: "date", expected: `${String(Math.floor(rand() * 30) + 1970)}-${String(Math.floor(rand() * 12) + 1).padStart(2, "0")}-${String(Math.floor(rand() * 28) + 1).padStart(2, "0")}` },
  ];

  const shuffled = shuffleArray(extra, rand);
  return [...base, ...shuffled.slice(0, difficulty + 1)];
}

export function DataFormStage({ difficulty, seed, onSubmit }: StageProps) {
  const fields = useMemo(() => makeFields(difficulty, seededRandom(seed)), [difficulty, seed]);
  const [values, setValues] = useState<Record<string, string>>({});

  const update = (id: string, val: string) => {
    setValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = () => {
    const allCorrect = fields.every((f) => (values[f.id] ?? "") === f.expected);
    onSubmit(allCorrect);
  };

  return (
    <div className="flex-col gap-md" style={{ alignItems: "center" }}>
      <p className="stage-prompt">Fill in the form</p>
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
          }}
        >
          Enter the data for: <strong>{fields[0]?.expected} {fields[1]?.expected}</strong>
          {fields.find((f) => f.id === "city") && <>, City: <strong>{fields.find((f) => f.id === "city")!.expected}</strong></>}
          {fields.find((f) => f.id === "country") && <>, Country: <strong>{fields.find((f) => f.id === "country")!.expected}</strong></>}
          {fields.find((f) => f.id === "email") && <>, Email: <strong>{fields.find((f) => f.id === "email")!.expected}</strong></>}
          {fields.find((f) => f.id === "phone") && <>, Phone: <strong>{fields.find((f) => f.id === "phone")!.expected}</strong></>}
          {fields.find((f) => f.id === "zip") && <>, ZIP: <strong>{fields.find((f) => f.id === "zip")!.expected}</strong></>}
          {fields.find((f) => f.id === "color") && <>, Fav Color: <strong>{fields.find((f) => f.id === "color")!.expected}</strong></>}
          {fields.find((f) => f.id === "dob") && <>, DOB: <strong>{fields.find((f) => f.id === "dob")!.expected}</strong></>}
        </div>
        <div className="flex-col" style={{ gap: 8 }}>
          {fields.map((f) => (
            <div key={f.id}>
              <label style={{ fontWeight: 700, fontSize: "0.9rem" }}>{f.label}</label>
              {f.type === "select" ? (
                <select
                  className="crayon-input"
                  value={values[f.id] ?? ""}
                  onChange={(e) => update(f.id, e.target.value)}
                >
                  <option value="">-- select --</option>
                  {f.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="crayon-input"
                  type={f.type}
                  value={values[f.id] ?? ""}
                  onChange={(e) => update(f.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  autoComplete="off"
                />
              )}
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
