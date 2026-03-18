import { useState, useEffect } from "react";
import { colors, fonts, TYPE_META } from "../lib/theme";
import { api, type ApiContentItem } from "../lib/api";

interface FilePreviewProps {
  item: ApiContentItem;
  onClose: () => void;
  onMove: (item: ApiContentItem) => void;
}

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico"]);
const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov"]);
const TEXT_EXTS = new Set([
  ".txt", ".md", ".ts", ".tsx", ".js", ".jsx", ".json", ".yml", ".yaml",
  ".rs", ".py", ".css", ".html", ".toml", ".sh", ".env", ".cfg", ".ini",
]);

function getExt(uri: string): string {
  const dot = uri.lastIndexOf(".");
  return dot >= 0 ? uri.slice(dot).toLowerCase() : "";
}

export function FilePreview({ item, onClose, onMove }: FilePreviewProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const ext = getExt(item.uri);
  const isImage = item.type === "image" || IMAGE_EXTS.has(ext);
  const isVideo = item.type === "video" || VIDEO_EXTS.has(ext);
  const isText = TEXT_EXTS.has(ext);
  const isPdf = ext === ".pdf";
  const meta = TYPE_META[item.type] ?? TYPE_META.file;

  useEffect(() => {
    if (isText) {
      fetch(api.fileServeUrl(item.uri))
        .then((r) => r.text())
        .then((t) => { setTextContent(t); setLoading(false); })
        .catch(() => { setTextContent("Failed to load file content."); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [item.uri, isText]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0c0c0c",
          border: `1px solid ${meta.color}44`,
          borderRadius: "4px",
          width: "min(90vw, 900px)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 18px",
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "18px", color: meta.color, fontFamily: fonts.mono }}>
            {meta.icon}
          </span>
          <span
            style={{
              flex: 1,
              fontSize: "13px",
              fontWeight: 600,
              color: "#fff",
              fontFamily: fonts.mono,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.title}
          </span>
          <span
            style={{
              fontSize: "9px",
              padding: "2px 7px",
              border: `1px solid ${meta.color}44`,
              borderRadius: "1px",
              color: meta.color,
              fontFamily: fonts.mono,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {meta.label}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: colors.textMuted,
              fontSize: "18px",
              cursor: "pointer",
              fontFamily: fonts.mono,
              padding: "0 4px",
            }}
          >
            x
          </button>
        </div>

        {/* Preview content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: isImage || isVideo || isPdf ? "0" : "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "200px",
          }}
        >
          {loading ? (
            <span style={{ color: colors.textMuted, fontSize: "12px", fontFamily: fonts.mono }}>
              LOADING...
            </span>
          ) : isImage ? (
            <img
              src={api.fileServeUrl(item.uri)}
              alt={item.title}
              style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
            />
          ) : isVideo ? (
            <video
              src={api.fileServeUrl(item.uri)}
              controls
              style={{ maxWidth: "100%", maxHeight: "70vh" }}
            />
          ) : isPdf ? (
            <iframe
              src={api.fileServeUrl(item.uri)}
              title={item.title}
              style={{ width: "100%", height: "70vh", border: "none" }}
            />
          ) : isText && textContent != null ? (
            <pre
              style={{
                width: "100%",
                margin: 0,
                fontSize: "12px",
                fontFamily: fonts.mono,
                color: colors.text,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: "1.6",
                maxHeight: "70vh",
                overflow: "auto",
              }}
            >
              {textContent}
            </pre>
          ) : (
            <div
              style={{
                textAlign: "center",
                color: colors.textDim,
                fontSize: "12px",
                fontFamily: fonts.mono,
              }}
            >
              <p style={{ marginBottom: "8px" }}>Preview not available for {ext || "this file type"}</p>
              <p style={{ color: colors.textGhost }}>Use OPEN to view in default app</p>
            </div>
          )}
        </div>

        {/* Path + Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 18px",
            borderTop: `1px solid ${colors.border}`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: "10px",
              color: colors.textDim,
              fontFamily: fonts.mono,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.uri}
          </span>
          <PreviewAction
            label="OPEN"
            color={colors.brand}
            onClick={() => { api.openFile(item.uri).catch(() => {}); }}
          />
          <PreviewAction
            label="MOVE"
            color={colors.cyan}
            onClick={() => onMove(item)}
          />
          <PreviewAction
            label="COPY PATH"
            color={colors.textDim}
            onClick={() => { navigator.clipboard.writeText(item.uri).catch(() => {}); }}
          />
        </div>
      </div>
    </div>
  );
}

function PreviewAction({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: "9px",
        fontFamily: fonts.mono,
        letterSpacing: "0.08em",
        padding: "4px 12px",
        background: `${color}15`,
        border: `1px solid ${color}44`,
        borderRadius: "2px",
        color,
        cursor: "pointer",
        transition: "all 0.1s",
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}
