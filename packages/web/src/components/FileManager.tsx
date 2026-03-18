import { useState, useCallback, useEffect, useRef } from "react";
import { colors, fonts } from "../lib/theme";
import { api } from "../lib/api";
import { FilePane } from "./FilePane";

interface FileManagerProps {
  onPreview: (path: string, type: string) => void;
}

interface FavoriteItem {
  name: string;
  path: string;
  icon: string;
}

// Favorites are populated from /api/system homedir — no hardcoded paths
const DEFAULT_FAVORITES: FavoriteItem[] = [];

const FAVORITES_KEY = "trove-file-manager-favorites";
const SIDEBAR_KEY = "trove-file-manager-sidebar";

function loadFavorites(): FavoriteItem[] {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_FAVORITES;
}

function saveFavorites(favs: FavoriteItem[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

export function FileManager({ onPreview }: FileManagerProps) {
  const [leftPath, setLeftPath] = useState("");
  const [rightPath, setRightPath] = useState("");
  const [refreshLeft, setRefreshLeft] = useState(0);
  const [refreshRight, setRefreshRight] = useState(0);
  const [toast, setToast] = useState<{ msg: string; undoFn?: () => void } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Favorites sidebar
  const [favorites, setFavorites] = useState<FavoriteItem[]>(loadFavorites);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) !== "closed"; } catch { return true; }
  });
  const [sidebarCtx, setSidebarCtx] = useState<{ x: number; y: number; idx: number } | null>(null);

  // Resizable panes
  const [dividerPos, setDividerPos] = useState(50); // percentage
  const isDraggingDivider = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch homedir from API and set initial paths + default favorites
  useEffect(() => {
    api.getSystemInfo().then((info: { homedir?: string }) => {
      const home = info.homedir ?? "";
      if (!home) return;
      const sep = home.includes("\\") ? "\\" : "/";
      if (!leftPath) setLeftPath(home + sep + "Desktop");
      if (!rightPath) setRightPath(home + sep + "Downloads");
      // Set default favorites if none saved
      if (favorites.length === 0) {
        const defaults: FavoriteItem[] = [
          { name: "Desktop", path: home + sep + "Desktop", icon: "\u25A3" },
          { name: "Documents", path: home + sep + "Documents", icon: "\u2630" },
          { name: "Downloads", path: home + sep + "Downloads", icon: "\u2B07" },
          { name: "Pictures", path: home + sep + "Pictures", icon: "\u25C8" },
        ];
        setFavorites(defaults);
        saveFavorites(defaults);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? "open" : "closed");
  }, [sidebarOpen]);

  // Toast management
  const showToast = (msg: string, undoFn?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, undoFn });
    setToastVisible(true);
    toastTimer.current = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToast(null), 300);
    }, 3500);
  };

  const dismissToast = () => {
    setToastVisible(false);
    setTimeout(() => setToast(null), 300);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  };

  const handleDrop = useCallback(async (files: string[], targetDir: string) => {
    if (files.length === 0) return;

    try {
      const movedFiles: Array<{ from: string; newPath: string }> = [];
      for (const file of files) {
        const result = await api.moveFile(file, targetDir);
        movedFiles.push({ from: file, newPath: result.newPath });
      }
      showToast(
        `Moved ${files.length} file${files.length > 1 ? "s" : ""}`,
        async () => {
          // Undo: move files back
          try {
            for (const { from, newPath } of movedFiles) {
              const originalDir = from.substring(0, from.lastIndexOf(from.includes("/") ? "/" : "\\"));
              await api.moveFile(newPath, originalDir);
            }
            setRefreshLeft((n) => n + 1);
            setRefreshRight((n) => n + 1);
            showToast("Undo complete");
          } catch {
            showToast("Undo failed");
          }
        }
      );
      setRefreshLeft((n) => n + 1);
      setRefreshRight((n) => n + 1);
    } catch (err) {
      showToast(`Error: ${err instanceof Error ? err.message : "move failed"}`);
    }
  }, []);

  // Divider drag handling
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingDivider.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingDivider.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const sidebarWidth = sidebarOpen ? 160 : 0;
      const availableWidth = rect.width - sidebarWidth;
      const relX = e.clientX - rect.left - sidebarWidth;
      const pct = Math.min(80, Math.max(20, (relX / availableWidth) * 100));
      setDividerPos(pct);
    };

    const handleMouseUp = () => {
      if (isDraggingDivider.current) {
        isDraggingDivider.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [sidebarOpen]);

  // Close sidebar context menu on click
  useEffect(() => {
    const handler = () => setSidebarCtx(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const addFavorite = (name: string, path: string) => {
    if (favorites.some(f => f.path === path)) return;
    const updated = [...favorites, { name, path, icon: "\u25C7" }];
    setFavorites(updated);
    saveFavorites(updated);
  };

  const removeFavorite = (idx: number) => {
    const updated = favorites.filter((_, i) => i !== idx);
    setFavorites(updated);
    saveFavorites(updated);
    setSidebarCtx(null);
  };

  const navigateToFavorite = (path: string) => {
    // Navigate left pane to this path
    setLeftPath(path);
    setRefreshLeft(n => n + 1);
  };

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}
    >
      {/* Hint bar */}
      <div
        style={{
          padding: "6px 12px",
          fontSize: "10px",
          fontFamily: fonts.mono,
          color: colors.textGhost,
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          gap: "16px",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span>Drag files between panes to move</span>
        <span style={{ fontSize: "9px" }}>
          Click = select
          {" \u00B7 "}Ctrl+Click = multi
          {" \u00B7 "}Dbl-click = preview
          {" \u00B7 "}Right-click = menu
        </span>
        <span style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "9px", color: colors.textGhost }}>
            Del \u00B7 F2 \u00B7 Ctrl+C \u00B7 Enter
          </span>
        </span>
      </div>

      {/* Main area: sidebar + dual panes */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Favorites sidebar */}
        <div style={{
          width: sidebarOpen ? "160px" : "0px",
          flexShrink: 0,
          borderRight: sidebarOpen ? `1px solid ${colors.border}` : "none",
          background: "rgba(255,255,255,0.01)",
          overflow: "hidden",
          transition: "width 0.2s ease",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: "8px 10px 6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: "9px",
              fontFamily: fonts.mono,
              color: colors.textDim,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              Favorites
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              title="Collapse sidebar"
              style={{
                fontSize: "10px",
                background: "none",
                border: "none",
                color: colors.textGhost,
                cursor: "pointer",
                padding: "0 2px",
                fontFamily: fonts.mono,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = colors.textMuted; }}
              onMouseLeave={e => { e.currentTarget.style.color = colors.textGhost; }}
            >
              {"\u2039"}
            </button>
          </div>

          {/* Favorite items */}
          <div style={{ flex: 1, overflow: "auto", padding: "4px 0" }}>
            {favorites.map((fav, i) => (
              <div
                key={fav.path}
                onClick={() => navigateToFavorite(fav.path)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSidebarCtx({ x: e.clientX, y: e.clientY, idx: i });
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 10px",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontFamily: fonts.mono,
                  color: colors.textMuted,
                  transition: "all 0.15s",
                  borderLeft: "2px solid transparent",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${colors.brand}10`;
                  e.currentTarget.style.color = colors.text;
                  e.currentTarget.style.borderLeftColor = colors.brand;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = colors.textMuted;
                  e.currentTarget.style.borderLeftColor = "transparent";
                }}
              >
                <span style={{ fontSize: "11px", opacity: 0.6, width: "14px", textAlign: "center" }}>
                  {fav.icon}
                </span>
                <span style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {fav.name}
                </span>
              </div>
            ))}
          </div>

          {/* Pin hint */}
          <div style={{
            padding: "6px 10px",
            borderTop: `1px solid ${colors.border}`,
            fontSize: "8px",
            fontFamily: fonts.mono,
            color: colors.textGhost,
            flexShrink: 0,
          }}>
            Right-click to unpin
          </div>

          {/* Sidebar context menu for removing favorites */}
          {sidebarCtx && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed",
                top: `${sidebarCtx.y}px`,
                left: `${sidebarCtx.x}px`,
                zIndex: 200,
                background: "#1a1a1a",
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                padding: "4px 0",
                minWidth: "120px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              }}
            >
              <div
                onClick={() => removeFavorite(sidebarCtx.idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontFamily: fonts.mono,
                  color: "#ef4444",
                  cursor: "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: "9px" }}>{"\u2715"}</span>
                <span>Unpin</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar collapse toggle (when closed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            title="Show favorites"
            style={{
              width: "20px",
              flexShrink: 0,
              background: "rgba(255,255,255,0.015)",
              border: "none",
              borderRight: `1px solid ${colors.border}`,
              color: colors.textGhost,
              cursor: "pointer",
              fontSize: "10px",
              fontFamily: fonts.mono,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
              padding: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${colors.brand}10`;
              e.currentTarget.style.color = colors.brand;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.015)";
              e.currentTarget.style.color = colors.textGhost;
            }}
          >
            {"\u203A"}
          </button>
        )}

        {/* Dual pane area */}
        <div style={{ flex: 1, display: "flex", minHeight: 0, padding: "4px", gap: 0 }}>
          {/* Left pane */}
          <div style={{ flex: `0 0 ${dividerPos}%`, minWidth: 0, paddingRight: "2px" }}>
            <FilePane
              id="left"
              initialPath={leftPath}
              onDrop={handleDrop}
              onPreview={onPreview}
              refreshKey={refreshLeft}
            />
          </div>

          {/* Resize divider */}
          <div
            onMouseDown={handleDividerMouseDown}
            style={{
              width: "6px",
              flexShrink: 0,
              cursor: "col-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              position: "relative",
            }}
            onMouseEnter={e => {
              const dot = e.currentTarget.querySelector("[data-divider-dot]") as HTMLElement;
              if (dot) dot.style.background = colors.brand;
            }}
            onMouseLeave={e => {
              const dot = e.currentTarget.querySelector("[data-divider-dot]") as HTMLElement;
              if (dot) dot.style.background = colors.textGhost;
            }}
          >
            <div
              data-divider-dot=""
              style={{
                width: "3px",
                height: "32px",
                borderRadius: "3px",
                background: colors.textGhost,
                transition: "background 0.15s, height 0.15s",
              }}
            />
          </div>

          {/* Right pane */}
          <div style={{ flex: `0 0 ${100 - dividerPos}%`, minWidth: 0, paddingLeft: "2px" }}>
            <FilePane
              id="right"
              initialPath={rightPath}
              onDrop={handleDrop}
              onPreview={onPreview}
              refreshKey={refreshRight}
            />
          </div>
        </div>
      </div>

      {/* Toast notification — slides up from bottom */}
      {toast && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: `translateX(-50%) translateY(${toastVisible ? "0" : "20px"})`,
            opacity: toastVisible ? 1 : 0,
            padding: "8px 16px",
            background: "rgba(26,26,26,0.95)",
            border: `1px solid ${colors.brand}44`,
            borderRadius: "8px",
            color: colors.text,
            fontSize: "11px",
            fontFamily: fonts.mono,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            transition: "all 0.3s ease",
            backdropFilter: "blur(8px)",
          }}
        >
          <span style={{ color: colors.brand, fontWeight: 600, fontSize: "12px" }}>{"\u2713"}</span>
          <span>{toast.msg}</span>
          {toast.undoFn && (
            <button
              onClick={() => {
                toast.undoFn?.();
                dismissToast();
              }}
              style={{
                background: "none",
                border: `1px solid ${colors.brand}44`,
                borderRadius: "4px",
                color: colors.brand,
                fontSize: "10px",
                fontFamily: fonts.mono,
                cursor: "pointer",
                padding: "2px 8px",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${colors.brand}20`;
                e.currentTarget.style.borderColor = colors.brand;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.borderColor = `${colors.brand}44`;
              }}
            >
              Undo
            </button>
          )}
          <button
            onClick={dismissToast}
            style={{
              background: "none",
              border: "none",
              color: colors.textGhost,
              cursor: "pointer",
              fontSize: "10px",
              fontFamily: fonts.mono,
              padding: "0 2px",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = colors.textMuted; }}
            onMouseLeave={e => { e.currentTarget.style.color = colors.textGhost; }}
          >
            {"\u2715"}
          </button>
        </div>
      )}
    </div>
  );
}
