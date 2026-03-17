import { useState, useEffect } from "react";

const BOOT_LINES = [
  "TROVE v0.1.0 — initializing...",
  "► scanning sources ... loading config",
  "► connecting connectors ... github · local",
  "► loading semantic index ... embeddings ready",
  "► MCP server ready on stdio",
  "SYSTEM READY ◈",
];

/**
 * Terminal boot sequence animation.
 * Returns the visible lines and whether boot is complete.
 */
export function useBootSequence(): { lines: string[]; done: boolean } {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setLines((prev) => [...prev, BOOT_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setDone(true), 600);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return { lines, done };
}
