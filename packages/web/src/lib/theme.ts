/** Trove design tokens — single source of truth for all colors and styles. */

export const colors = {
  brand: "#f97316",
  brandDim: "rgba(249,115,22,0.7)",
  brandGlow: "rgba(249,115,22,0.15)",
  brandSubtle: "rgba(249,115,22,0.06)",

  cyan: "#06b6d4",
  green: "#22c55e",
  purple: "#a855f7",

  bg: "#080808",
  surface: "rgba(255,255,255,0.03)",
  surfaceHover: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.1)",

  text: "#e5e5e5",
  textMuted: "#737373",
  textDim: "#525252",
  textGhost: "#404040",
  textDark: "#333",
} as const;

export const TYPE_META: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  github: { icon: "⬡", color: colors.brand, label: "GitHub" },
  image: { icon: "◈", color: colors.cyan, label: "Image" },
  video: { icon: "▶", color: colors.purple, label: "Video" },
  file: { icon: "◻", color: colors.green, label: "File" },
  document: { icon: "▣", color: colors.cyan, label: "Document" },
  bookmark: { icon: "◆", color: colors.purple, label: "Bookmark" },
};

export const FILTERS = ["All", "GitHub", "Image", "Video", "File", "Document"];

export const fonts = {
  mono: "'Courier New', monospace",
} as const;
