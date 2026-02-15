/**
 * Progress ring for next milestone (one visual, chunked).
 */
import type { HomepagePayload } from "../../services/homepage.service";

interface ProgressRingProps {
  milestone: HomepagePayload["nextMilestone"] | null | undefined;
  isLoading?: boolean;
}

const SIZE = 56;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const C = SIZE / 2;

export function ProgressRing({ milestone, isLoading }: ProgressRingProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-border/20 animate-pulse" />
        <div className="h-4 bg-border/20 rounded animate-pulse w-24" />
      </div>
    );
  }
  if (!milestone) return null;

  const { progress } = milestone;
  const ratio = Math.min(1, Math.max(0, progress.ratio));
  const circumference = 2 * Math.PI * R;
  const offset = circumference * (1 - ratio);

  return (
    <div className="flex items-center gap-3">
      <svg width={SIZE} height={SIZE} className="flex-shrink-0">
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-border"
        />
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${C} ${C})`}
          className="text-accent transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <div>
        <p className="text-text font-medium text-sm">
          {progress.currentValue} / {progress.targetValue}{" "}
          {progress.unit === "percent" ? "%" : progress.unit}
        </p>
        <p className="text-text-muted text-xs">{milestone.name}</p>
      </div>
    </div>
  );
}
