export function CountdownOverlay({ seconds }: { seconds: number }) {
  return (
    <div className="countdown-overlay">
      <div className="countdown-number" key={seconds}>
        {seconds}
      </div>
    </div>
  );
}
