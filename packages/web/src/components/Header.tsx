import { colors, fonts } from "../lib/theme";

const NAV_ITEMS = ["CONTENT", "SOURCES", "MCP", "SETTINGS"];

export function Header() {
  return (
    <div
      style={{
        borderBottom: `1px solid ${colors.border}`,
        padding: "0 32px",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "52px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "18px" }}>🦞</span>
        <span
          style={{
            fontWeight: "700",
            letterSpacing: "0.2em",
            fontSize: "13px",
            color: colors.brand,
            fontFamily: fonts.mono,
          }}
        >
          TROVE
        </span>
        <span style={{ color: colors.textDark, fontSize: "12px" }}>|</span>
        <span
          style={{
            color: colors.textGhost,
            fontSize: "11px",
            letterSpacing: "0.1em",
          }}
        >
          v0.1.0
        </span>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        {NAV_ITEMS.map((item) => (
          <span
            key={item}
            style={{
              fontSize: "10px",
              letterSpacing: "0.12em",
              cursor: "pointer",
              padding: "4px 0",
              fontFamily: fonts.mono,
              borderBottom:
                item === "CONTENT"
                  ? `1px solid ${colors.brand}`
                  : "1px solid transparent",
              color: item === "CONTENT" ? colors.brand : colors.textGhost,
            }}
          >
            {item}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: colors.green,
            boxShadow: `0 0 6px ${colors.green}`,
          }}
        />
        <span
          style={{
            fontSize: "10px",
            color: colors.textDim,
            letterSpacing: "0.1em",
            fontFamily: fonts.mono,
          }}
        >
          INDEXED
        </span>
      </div>
    </div>
  );
}
