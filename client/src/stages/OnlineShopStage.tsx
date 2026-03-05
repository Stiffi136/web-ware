import { useMemo } from "react";
import type { StageProps } from "../types/game.ts";
import { seededRandom, shuffleArray } from "../utils/random.ts";

const PRODUCTS = [
  "USB Cable", "Wireless Mouse", "Bluetooth Speaker", "Phone Case",
  "Laptop Stand", "LED Strip", "HDMI Adapter", "Power Bank",
  "Webcam HD", "Desk Lamp", "Keyboard", "Monitor Arm",
  "Headphones", "Mousepad XL", "USB Hub", "Screen Protector",
  "Cable Organizer", "Stylus Pen", "Ring Light", "Mic Stand",
  "SD Card 64GB", "Ethernet Cable", "Surge Protector", "Clip Fan",
  "Wrist Rest", "Chair Cushion", "Laptop Bag", "Docking Station",
];

const PRICE_RANGE = { min: 4.99, max: 89.99 };

type Product = {
  name: string;
  price: string;
  rating: number;
  reviews: number;
  isTarget: boolean;
};

export function OnlineShopStage({ difficulty, seed, onSubmit }: StageProps) {
  const { target, products } = useMemo(() => {
    const rand = seededRandom(seed);
    const count = 4 + difficulty * 4;
    const shuffled = shuffleArray([...PRODUCTS], rand).slice(0, count);
    const targetIdx = Math.floor(rand() * shuffled.length);
    const items: Product[] = shuffled.map((name, i) => ({
      name,
      price: (PRICE_RANGE.min + rand() * (PRICE_RANGE.max - PRICE_RANGE.min)).toFixed(2),
      rating: Math.floor(rand() * 5) + 1,
      reviews: Math.floor(rand() * 500),
      isTarget: i === targetIdx,
    }));
    return { target: items[targetIdx]!, products: items };
  }, [difficulty, seed]);

  return (
    <div className="flex-col gap-md" style={{ alignItems: "center" }}>
      <p className="stage-prompt">
        Buy: <strong>{target.name}</strong>
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 10,
          width: "min(640px, 100%)",
        }}
      >
        {products.map((p, i) => (
          <button
            key={i}
            className="crayon-card"
            onClick={() => onSubmit(p.isTarget)}
            style={{
              background: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              textAlign: "left",
              border: 0,
              fontFamily: "inherit",
              transform: `rotate(${String((i % 3 - 1) * 0.4)}deg)`,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: "0.95rem", marginBottom: 4 }}>
              {p.name}
            </div>
            <div style={{ fontWeight: 700, color: "var(--orange)" }}>
              ${p.price}
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
              {"*".repeat(p.rating)}{"_".repeat(5 - p.rating)} ({p.reviews})
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
