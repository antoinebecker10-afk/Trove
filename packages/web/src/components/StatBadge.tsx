import { colors, fonts } from "../lib/theme";

interface StatBadgeProps {
  label: string;
  value: string | number;
  color: string;
}

export function StatBadge({ label, value, color }: StatBadgeProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "12px 20px",
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${colors.border}`,
        borderRadius: "2px",
        borderTop: `2px solid ${color}`,
      }}
    >
      <span
        style={{
          fontSize: "22px",
          fontWeight: "700",
          color,
          fontFamily: fonts.mono,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: "10px",
          color: colors.textDim,
          fontFamily: fonts.mono,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}
