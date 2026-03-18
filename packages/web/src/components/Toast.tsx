import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { colors, fonts, radii, shadows, transitions, zIndex } from "../lib/theme";

/* ------------------------------------------------------------------
 *  Types
 * ------------------------------------------------------------------ */

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  onUndo?: () => void;
  exiting: boolean;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, onUndo?: () => void) => void;
}

/* ------------------------------------------------------------------
 *  Context
 * ------------------------------------------------------------------ */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/* ------------------------------------------------------------------
 *  Provider
 * ------------------------------------------------------------------ */

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "info", onUndo?: () => void) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type, onUndo, exiting: false }]);
      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/* ------------------------------------------------------------------
 *  Container (portal)
 * ------------------------------------------------------------------ */

const TYPE_COLORS: Record<ToastType, string> = {
  success: colors.success,
  error: colors.error,
  info: colors.cyan,
};

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        bottom: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        zIndex: zIndex.toast,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------
 *  Single toast
 * ------------------------------------------------------------------ */

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const accent = TYPE_COLORS[toast.type];

  /* Entry animation via ref to trigger reflow */
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const show = visible && !toast.exiting;

  return (
    <div
      ref={ref}
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 16px",
        background: "rgba(16,16,16,0.92)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${accent}44`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: radii.sm,
        boxShadow: shadows.md,
        fontFamily: fonts.mono,
        fontSize: "11px",
        color: colors.text,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(12px)",
        transition: `opacity ${transitions.normal}, transform ${transitions.normal}`,
        maxWidth: "420px",
      }}
    >
      {/* Dot indicator */}
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: accent,
          boxShadow: `0 0 6px ${accent}88`,
          flexShrink: 0,
        }}
      />

      <span style={{ flex: 1 }}>{toast.message}</span>

      {/* Undo button — success type only, if callback provided */}
      {toast.type === "success" && toast.onUndo && (
        <button
          onClick={() => {
            toast.onUndo?.();
            onDismiss(toast.id);
          }}
          style={{
            fontSize: "9px",
            fontFamily: fonts.mono,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "2px 8px",
            background: `${accent}15`,
            border: `1px solid ${accent}44`,
            borderRadius: "2px",
            color: accent,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          UNDO
        </button>
      )}

      {/* Close */}
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: "none",
          border: "none",
          color: colors.textGhost,
          cursor: "pointer",
          fontSize: "12px",
          padding: "0 2px",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
