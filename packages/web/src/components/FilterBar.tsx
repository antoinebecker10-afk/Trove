import { colors, fonts, FILTERS } from "../lib/theme";

interface FilterBarProps {
  active: string;
  onFilter: (filter: string) => void;
  resultCount: number;
}

export function FilterBar({ active, onFilter, resultCount }: FilterBarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        marginBottom: "20px",
        animation: "fadeIn 0.5s ease 0.25s both",
      }}
    >
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onFilter(f)}
          style={{
            padding: "5px 14px",
            fontSize: "10px",
            letterSpacing: "0.1em",
            fontFamily: fonts.mono,
            cursor: "pointer",
            borderRadius: "1px",
            border: `1px solid ${active === f ? `${colors.brand}80` : "rgba(255,255,255,0.08)"}`,
            background: active === f ? colors.brandGlow : "transparent",
            color: active === f ? colors.brand : colors.textDim,
            transition: "all 0.15s",
            textTransform: "uppercase",
          }}
        >
          {f}
        </button>
      ))}
      <span
        style={{
          marginLeft: "auto",
          fontSize: "11px",
          color: colors.textDark,
          alignSelf: "center",
          fontFamily: fonts.mono,
        }}
      >
        {resultCount} items
      </span>
    </div>
  );
}
