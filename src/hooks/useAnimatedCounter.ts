/**
 * useAnimatedCounter
 * Animates a number from 0 to end over durationMs. Uses requestAnimationFrame.
 */

import { useEffect, useState } from "react";

export function useAnimatedCounter(
  end: number,
  durationMs: number,
  isActive: boolean
): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCount(0);
      return;
    }
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      setCount(Math.round(t * end));
      if (t < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [end, durationMs, isActive]);

  return count;
}
