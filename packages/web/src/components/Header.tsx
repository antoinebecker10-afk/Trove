import { useState, useEffect, useCallback } from "react";
import { colors, fonts, transitions } from "../lib/theme";

export type ViewMode = "files" | "launcher" | "search" | "sources";

const NAV_ITEMS: Array<{ key: ViewMode; label: string; icon: string }> = [
  { key: "files", label: "FILES", icon: "📂" },
  { key: "launcher", label: "LAUNCHER", icon: "🚀" },
  { key: "search", label: "SEARCH", icon: "🔍" },
  { key: "sources", label: "SOURCES", icon: "⚡" },
];

interface HeaderProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const keyframesInjected = (() => {
  if (typeof document === "undefined") return true;
  const id = "trove-header-keyframes";
  if (document.getElementById(id)) return true;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @keyframes troveStatusPulse {
      0%, 100% { box-shadow: 0 0 4px rgba(34,197,94,0.4); }
      50% { box-shadow: 0 0 10px rgba(34,197,94,0.7), 0 0 20px rgba(34,197,94,0.3); }
    }
    @keyframes troveLogoGlow {
      0%, 100% { filter: drop-shadow(0 0 0px transparent); }
      50% { filter: drop-shadow(0 0 6px rgba(249,115,22,0.4)); }
    }
  `;
  document.head.appendChild(style);
  return true;
})();

export function Header({ view, onViewChange }: HeaderProps) {
  void keyframesInjected;

  const [scrolled, setScrolled] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<ViewMode | null>(null);
  const [ctrlKHovered, setCtrlKHovered] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 8);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* Main header bar */}
      <div
        style={{
          padding: "0 24px",
          background: scrolled ? "rgba(8,8,8,0.85)" : "rgba(8,8,8,0.6)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "52px",
          transition: `background ${transitions.normal}`,
        }}
      >
        {/* Left: Logo area */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            role="img"
            aria-label="Trove"
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            style={{
              fontSize: "20px",
              cursor: "default",
              transition: `all ${transitions.normal}`,
              animation: logoHovered ? "troveLogoGlow 1.5s ease infinite" : "none",
              transform: logoHovered ? "scale(1.1)" : "scale(1)",
              display: "inline-block",
            }}
          >
            🦞
          </span>
          <span
            style={{
              fontWeight: 700,
              letterSpacing: "0.25em",
              fontSize: "13px",
              color: colors.brand,
              fontFamily: fonts.mono,
            }}
          >
            TROVE
          </span>
          <span
            style={{
              color: colors.textGhost,
              fontSize: "10px",
              letterSpacing: "0.05em",
              fontFamily: fonts.mono,
              opacity: 0.6,
            }}
          >
            v0.1.0
          </span>
        </div>

        {/* Center: Navigation tabs */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "9999px",
            padding: "3px",
            border: `1px solid ${colors.borderSubtle}`,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = view === item.key;
            const hovered = hoveredTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => onViewChange(item.key)}
                onMouseEnter={() => setHoveredTab(item.key)}
                onMouseLeave={() => setHoveredTab(null)}
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.12em",
                  cursor: "pointer",
                  padding: "6px 16px",
                  fontFamily: fonts.mono,
                  fontWeight: active ? 600 : 400,
                  background: active
                    ? colors.brand
                    : hovered
                      ? "rgba(255,255,255,0.05)"
                      : "transparent",
                  border: "none",
                  borderRadius: "9999px",
                  color: active ? "#fff" : hovered ? colors.text : colors.textDim,
                  transition: `all ${transitions.fast}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  outline: "none",
                  boxShadow: active
                    ? `0 1px 4px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`
                    : "none",
                }}
              >
                <span style={{ fontSize: "10px", lineHeight: 1 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right: Status + shortcut */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {/* Status indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: colors.green,
                animation: "troveStatusPulse 2s ease infinite",
              }}
            />
            <span
              style={{
                fontSize: "9px",
                color: colors.green,
                letterSpacing: "0.1em",
                fontFamily: fonts.mono,
                fontWeight: 500,
                opacity: 0.9,
              }}
            >
              ONLINE
            </span>
          </div>

          {/* Ctrl+K shortcut hint */}
          <button
            onMouseEnter={() => setCtrlKHovered(true)}
            onMouseLeave={() => setCtrlKHovered(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              background: ctrlKHovered
                ? "rgba(249,115,22,0.1)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${ctrlKHovered ? colors.brand + "40" : colors.border}`,
              borderRadius: "6px",
              cursor: "pointer",
              transition: `all ${transitions.fast}`,
              outline: "none",
              boxShadow: ctrlKHovered
                ? `0 0 12px rgba(249,115,22,0.15), 0 0 4px rgba(249,115,22,0.1)`
                : "none",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                color: ctrlKHovered ? colors.brand : colors.textDim,
                fontFamily: fonts.mono,
                letterSpacing: "0.05em",
                transition: `color ${transitions.fast}`,
              }}
            >
              Ctrl+K
            </span>
          </button>
        </div>
      </div>

      {/* Bottom gradient border */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, transparent 0%, ${colors.brand}30 30%, ${colors.cyan}25 70%, transparent 100%)`,
        }}
      />
    </div>
  );
}
