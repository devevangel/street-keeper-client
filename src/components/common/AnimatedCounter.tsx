/**
 * AnimatedCounter
 * Displays a number that animates from 0 to value over the given duration.
 */

import { useAnimatedCounter } from "../../hooks/useAnimatedCounter";

export interface AnimatedCounterProps {
  value: number;
  durationMs?: number;
  isActive?: boolean;
  className?: string;
  /** Optional suffix (e.g. " streets") */
  suffix?: string;
}

export function AnimatedCounter({
  value,
  durationMs = 2000,
  isActive = true,
  className = "",
  suffix = "",
}: AnimatedCounterProps) {
  const count = useAnimatedCounter(value, durationMs, isActive);
  return (
    <span className={className}>
      {count}
      {suffix}
    </span>
  );
}
