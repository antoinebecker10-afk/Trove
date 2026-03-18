import { colors, radii } from "../lib/theme";

/* ------------------------------------------------------------------
 *  Shared shimmer style — uses the `shimmer` keyframe from global.css.
 *  Background: translucent surface with a moving highlight band.
 * ------------------------------------------------------------------ */

const shimmerBase: React.CSSProperties = {
  background: `linear-gradient(
    90deg,
    ${colors.surface} 25%,
    rgba(255,255,255,0.06) 50%,
    ${colors.surface} 75%
  )`,
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s ease-in-out infinite",
  borderRadius: radii.sm,
};

/* ------------------------------------------------------------------
 *  SkeletonRow
 * ------------------------------------------------------------------ */

interface SkeletonRowProps {
  height?: number;
  width?: string;
}

export function SkeletonRow({ height = 40, width = "100%" }: SkeletonRowProps) {
  return (
    <div
      style={{
        ...shimmerBase,
        height: `${height}px`,
        width,
      }}
    />
  );
}

/* ------------------------------------------------------------------
 *  SkeletonText
 * ------------------------------------------------------------------ */

interface SkeletonTextProps {
  width?: string;
  height?: number;
}

export function SkeletonText({ width = "60%", height = 12 }: SkeletonTextProps) {
  return (
    <div
      style={{
        ...shimmerBase,
        height: `${height}px`,
        width,
        borderRadius: radii.full,
      }}
    />
  );
}

/* ------------------------------------------------------------------
 *  SkeletonGrid
 * ------------------------------------------------------------------ */

interface SkeletonGridProps {
  count?: number;
  cardHeight?: number;
  columns?: number;
}

export function SkeletonGrid({
  count = 6,
  cardHeight = 120,
  columns = 3,
}: SkeletonGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "12px",
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            ...shimmerBase,
            height: `${cardHeight}px`,
            borderRadius: radii.md,
          }}
        />
      ))}
    </div>
  );
}
