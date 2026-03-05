import { useState } from "react";

type Props = {
  volume: number;
  setVolume: (v: number) => void;
};

export function VolumeSlider({ volume, setVolume }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="volume-fab">
      {open && (
        <div className="volume-popup">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="volume-range"
          />
        </div>
      )}
      <button
        className="volume-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Volume"
      >
        {volume === 0 ? "\u{1F507}" : volume < 0.5 ? "\u{1F509}" : "\u{1F50A}"}
      </button>
    </div>
  );
}
