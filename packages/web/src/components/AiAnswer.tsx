import { colors, fonts } from "../lib/theme";

interface AiAnswerProps {
  text: string;
}

export function AiAnswer({ text }: AiAnswerProps) {
  return (
    <div
      style={{
        background: colors.brandSubtle,
        border: `1px solid ${colors.brand}40`,
        borderRadius: "2px",
        padding: "12px 16px",
        marginBottom: "20px",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          color: colors.brand,
          fontFamily: fonts.mono,
          letterSpacing: "0.05em",
        }}
      >
        {text}
      </span>
    </div>
  );
}
