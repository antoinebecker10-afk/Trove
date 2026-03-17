import { useState, useEffect } from "react";

const GLITCH_CHARS = "▓▒░█▄▀■□▪▫";

/**
 * Glitch text effect — scrambles characters then resolves to the real text.
 */
export function useGlitch(text: string, active: boolean): string {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!active) {
      setDisplay(text);
      return;
    }

    let frame = 0;
    const interval = setInterval(() => {
      if (frame > text.length * 1.5) {
        setDisplay(text);
        clearInterval(interval);
        return;
      }
      setDisplay(
        text
          .split("")
          .map((c, idx) =>
            idx < frame / 1.5
              ? c
              : Math.random() > 0.5
                ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
                : c,
          )
          .join(""),
      );
      frame++;
    }, 28);

    return () => clearInterval(interval);
  }, [active, text]);

  return display;
}
