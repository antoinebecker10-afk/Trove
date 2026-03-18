import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { colors, fonts, radii, shadows, transitions, zIndex } from "../lib/theme";

/* ------------------------------------------------------------------
 *  Types
 * ------------------------------------------------------------------ */

interface Shortcut {
  keys: string;
  description: string;
}

interface ShortcutCategory {
  title: string;
  shortcuts: Shortcut[];
}

/* ------------------------------------------------------------------
 *  Shortcut data
 * ------------------------------------------------------------------ */

const CATEGORIES: ShortcutCategory[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: "1 – 5", description: "Switch view tabs" },
      { keys: "Tab", description: "Cycle between panels" },
      { keys: "↑ / ↓", description: "Navigate list items" },
      { keys: "Enter", description: "Open selected item" },
    ],
  },
  {
    title: "File Manager",
    shortcuts: [
      { keys: "Backspace", description: "Go to parent directory" },
      { keys: "Space", description: "Quick preview file" },
      { keys: "Ctrl+N", description: "New folder" },
      { keys: "F2", description: "Rename selected" },
      { keys: "Delete", description: "Delete selected" },
    ],
  },
  {
    title: "Search",
    shortcuts: [
      { keys: "Ctrl+K", description: "Open command palette" },
      { keys: "/", description: "Focus search bar" },
      { keys: "Escape", description: "Clear search / close" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: "?", description: "Show this help" },
      { keys: "Ctrl+R", description: "Reindex sources" },
      { keys: "Ctrl+,", description: "Open settings" },
      { keys: "Escape", description: "Close modal / overlay" },
    ],
  },
];

/* ------------------------------------------------------------------
 *  Component
 * ------------------------------------------------------------------ */

export function KeyboardHelp() {
  const [open, setOpen] = useState(false);

  const handleKey = useCallback((e: KeyboardEvent) => {
    /* Ignore if user is typing in an input */
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
    if (e.key === "Escape" && open) {
      setOpen(false);
    }
  }, [open]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: zIndex.modal,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "560px",
          maxWidth: "90vw",
          maxHeight: "80vh",
          overflowY: "auto",
          background: "rgba(16,16,16,0.95)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${colors.borderHover}`,
          borderRadius: radii.lg,
          boxShadow: shadows.lg,
          padding: "28px 32px",
          zIndex: zIndex.modal + 1,
          fontFamily: fonts.mono,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: colors.text,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Keyboard Shortcuts
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: colors.textGhost,
              cursor: "pointer",
              fontSize: "14px",
              padding: "2px 4px",
              transition: `color ${transitions.fast}`,
            }}
          >
            ESC
          </button>
        </div>

        {/* Grid of categories */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          {CATEGORIES.map((cat) => (
            <div key={cat.title}>
              <div
                style={{
                  fontSize: "9px",
                  color: colors.brand,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                  fontWeight: 600,
                }}
              >
                {cat.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {cat.shortcuts.map((sc) => (
                  <div
                    key={sc.keys}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: colors.textMuted }}>
                      {sc.description}
                    </span>
                    <Kbd>{sc.keys}</Kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
}

/* ------------------------------------------------------------------
 *  Keyboard key badge
 * ------------------------------------------------------------------ */

function Kbd({ children }: { children: string }) {
  return (
    <span
      style={{
        fontSize: "9px",
        fontFamily: fonts.mono,
        color: colors.text,
        background: colors.surfaceElevated,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.sm,
        padding: "2px 6px",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}
