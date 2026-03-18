import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { colors, fonts, radii, shadows, transitions, zIndex } from "../lib/theme";

/* ------------------------------------------------------------------
 *  Types
 * ------------------------------------------------------------------ */

export interface ContextMenuItem {
  label: string;
  icon?: string;
  shortcut?: string;
  danger?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

/* ------------------------------------------------------------------
 *  Component
 * ------------------------------------------------------------------ */

export function ContextMenu({ items, x, y, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });
  const [visible, setVisible] = useState(false);

  /* Adjust position to stay within viewport */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = x + rect.width > window.innerWidth ? window.innerWidth - rect.width - 8 : x;
    const ny = y + rect.height > window.innerHeight ? window.innerHeight - rect.height - 8 : y;
    setPos({ x: Math.max(8, nx), y: Math.max(8, ny) });
    requestAnimationFrame(() => setVisible(true));
  }, [x, y]);

  /* Close on click outside */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick, true);
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handleClick, true);
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: pos.y,
        left: pos.x,
        minWidth: "180px",
        background: "rgba(16,16,16,0.92)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${colors.borderHover}`,
        borderRadius: radii.md,
        boxShadow: shadows.lg,
        padding: "4px 0",
        zIndex: zIndex.popover,
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.96)",
        transformOrigin: "top left",
        transition: `opacity ${transitions.fast}, transform ${transitions.fast}`,
      }}
    >
      {items.map((item, i) => (
        <ContextMenuEntry key={i} item={item} onClose={onClose} />
      ))}
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------
 *  Single menu entry
 * ------------------------------------------------------------------ */

function ContextMenuEntry({
  item,
  onClose,
}: {
  item: ContextMenuItem;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const textColor = item.danger
    ? colors.error
    : hovered
      ? colors.text
      : colors.textMuted;

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        item.onClick();
        onClose();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        padding: "6px 12px",
        background: hovered ? colors.surfaceHover : "transparent",
        border: "none",
        borderRadius: 0,
        cursor: "pointer",
        fontFamily: fonts.mono,
        fontSize: "10px",
        color: textColor,
        letterSpacing: "0.02em",
        textAlign: "left",
        transition: `background ${transitions.fast}, color ${transitions.fast}`,
      }}
    >
      {item.icon && (
        <span style={{ fontSize: "12px", width: "16px", textAlign: "center", flexShrink: 0 }}>
          {item.icon}
        </span>
      )}
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.shortcut && (
        <span
          style={{
            fontSize: "9px",
            color: colors.textGhost,
            fontFamily: fonts.mono,
            letterSpacing: "0.06em",
            flexShrink: 0,
          }}
        >
          {item.shortcut}
        </span>
      )}
    </button>
  );
}
