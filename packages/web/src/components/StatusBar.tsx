import { useEffect, useState, useCallback } from "react";
import { colors, fonts, zIndex, transitions } from "../lib/theme";
import { api } from "../lib/api";

interface StatusBarProps {
  viewName?: string;
}

export function StatusBar({ viewName = "Dashboard" }: StatusBarProps) {
  const [connected, setConnected] = useState(true);
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [lastIndexed, setLastIndexed] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const stats = await api.stats();
      setConnected(true);
      setItemCount(stats.totalItems);
      setLastIndexed(stats.lastIndexedAt);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10_000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        height: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        background: "rgba(255,255,255,0.02)",
        borderTop: `1px solid ${colors.border}`,
        fontFamily: fonts.mono,
        fontSize: "9px",
        color: colors.textDim,
        zIndex: zIndex.sticky,
        userSelect: "none",
        letterSpacing: "0.04em",
      }}
    >
      {/* Left: view name + shortcut hint */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ color: colors.textMuted, textTransform: "uppercase" }}>
          {viewName}
        </span>
        <span style={{ color: colors.textGhost }}>
          Ctrl+K to search
        </span>
      </div>

      {/* Center: connection status */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: connected ? colors.success : colors.error,
            boxShadow: connected
              ? `0 0 6px ${colors.success}88`
              : `0 0 6px ${colors.error}88`,
            transition: `background ${transitions.normal}, box-shadow ${transitions.normal}`,
          }}
        />
        <span style={{ color: connected ? colors.textDim : colors.error }}>
          {connected ? "API connected" : "disconnected"}
        </span>
      </div>

      {/* Right: index count + last indexed */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {itemCount !== null && (
          <span style={{ color: colors.textMuted }}>
            {itemCount.toLocaleString()} items indexed
          </span>
        )}
        {lastIndexed && (
          <span style={{ color: colors.textGhost }}>
            {formatTimeAgo(lastIndexed)}
          </span>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
