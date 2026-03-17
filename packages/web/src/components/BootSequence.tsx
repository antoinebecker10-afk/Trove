import { colors, fonts } from "../lib/theme";
import { useBootSequence } from "../hooks/useBootSequence";

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const { lines, done } = useBootSequence();

  if (done) {
    // Trigger transition to main UI on next frame
    requestAnimationFrame(onComplete);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.mono,
      }}
    >
      <div style={{ maxWidth: "500px", width: "100%", padding: "40px" }}>
        <div
          style={{
            color: colors.brand,
            fontSize: "13px",
            marginBottom: "24px",
            letterSpacing: "0.15em",
          }}
        >
          🦞 TROVE
        </div>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: "12px",
              color: i === lines.length - 1 ? colors.text : colors.textDim,
              marginBottom: "6px",
              animation: "fadeIn 0.3s ease",
            }}
          >
            {line}
          </div>
        ))}
        <div
          style={{
            marginTop: "16px",
            color: colors.brand,
            fontSize: "12px",
            animation: "blink 1s infinite",
          }}
        >
          █
        </div>
      </div>
    </div>
  );
}
