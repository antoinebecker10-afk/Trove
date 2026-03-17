import { useState } from "react";
import { colors, fonts } from "../lib/theme";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        background: focused ? colors.brandSubtle : colors.surface,
        border: `1px solid ${focused ? `${colors.brand}99` : colors.border}`,
        borderRadius: "2px",
        transition: "all 0.2s",
        boxShadow: focused
          ? `0 0 0 3px rgba(249,115,22,0.1), inset 0 0 20px ${colors.brandSubtle}`
          : "none",
      }}
    >
      <span
        style={{
          padding: "0 14px",
          color: colors.brandDim,
          fontSize: "18px",
          fontFamily: fonts.mono,
        }}
      >
        ⌕
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        placeholder='Search — "terrain screenshot", "rust api", "invoice bpmn"...'
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: colors.text,
          fontSize: "14px",
          padding: "14px 0",
          fontFamily: fonts.mono,
          letterSpacing: "0.02em",
        }}
      />
      <button
        onClick={onSearch}
        style={{
          margin: "6px",
          padding: "6px 18px",
          background: colors.brandGlow,
          border: `1px solid ${colors.brand}66`,
          borderRadius: "2px",
          color: colors.brand,
          fontSize: "11px",
          fontFamily: fonts.mono,
          letterSpacing: "0.1em",
          cursor: "pointer",
          textTransform: "uppercase",
          transition: "all 0.15s",
        }}
      >
        FIND
      </button>
    </div>
  );
}
