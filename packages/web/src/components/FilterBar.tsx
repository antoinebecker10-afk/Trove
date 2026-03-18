import { colors, fonts, FILTERS, SOURCES, SOURCE_META } from "../lib/theme";

interface FilterBarProps {
  active: string;
  onFilter: (filter: string) => void;
  activeSource: string;
  onSourceFilter: (source: string) => void;
  resultCount: number;
}

export function FilterBar({ active, onFilter, activeSource, onSourceFilter, resultCount }: FilterBarProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "20px",
        animation: "fadeIn 0.5s ease 0.25s both",
      }}
    >
      {/* Type filters */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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

      {/* Source filters */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <span
          style={{
            fontSize: "9px",
            color: colors.textGhost,
            fontFamily: fonts.mono,
            letterSpacing: "0.1em",
            marginRight: "4px",
          }}
        >
          SOURCE
        </span>
        {SOURCES.map((s) => {
          const meta = SOURCE_META[s.toLowerCase()];
          const isActive = activeSource === s;
          const accentColor = meta?.color ?? colors.textDim;
          return (
            <button
              key={s}
              onClick={() => onSourceFilter(s)}
              style={{
                padding: "3px 10px",
                fontSize: "9px",
                letterSpacing: "0.08em",
                fontFamily: fonts.mono,
                cursor: "pointer",
                borderRadius: "1px",
                border: `1px solid ${isActive ? `${accentColor}80` : "rgba(255,255,255,0.05)"}`,
                background: isActive ? `${accentColor}15` : "transparent",
                color: isActive ? accentColor : colors.textGhost,
                transition: "all 0.15s",
                textTransform: "uppercase",
              }}
            >
              {meta?.icon ? `${meta.icon} ` : ""}{s}
            </button>
          );
        })}
      </div>
    </div>
  );
}
