/**
 * ProgressRing
 * SVG-based circular progress. Optional animation on scroll into view.
 * Use for "Your Progress" (streets conquered, % explored).
 */

import { useEffect, useRef, useState } from "react";

export interface ProgressRingProps {
  /** 0–100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 8,
  animated = true,
  children,
  className = "",
}: ProgressRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!animated || !ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setHasAnimated(true);
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [animated]);

  const r = (size - strokeWidth) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = Math.min(1, Math.max(0, value / 100));
  const offset = circumference * (1 - (animated && hasAnimated ? ratio : ratio));

  return (
    <div ref={ref} className={`flex items-center gap-4 ${className}`}>
      <svg width={size} height={size} className="flex-shrink-0">
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border/40"
        />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`}
          className="text-success transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {children != null && <div className="min-w-0">{children}</div>}
    </div>
  );
}
