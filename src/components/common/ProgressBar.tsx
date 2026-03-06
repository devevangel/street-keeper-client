/**
 * ProgressBar
 * Visual progress indicator. Always pair with a numeric value (e.g. "42 / 128" or "32%") per MAIN-STYLING-GUIDE.
 *
 * @example
 * <div>
 *   <span className="text-sm text-text-muted">42 / 128 streets · 32%</span>
 *   <ProgressBar percentage={32} height={6} />
 * </div>
 */

export interface ProgressBarProps {
  /** Progress from 0 to 100 */
  percentage: number;
  /** Bar height in pixels (4, 6, or 8). Default 6. */
  height?: 4 | 6 | 8;
  /** Optional: show percentage label inside or beside bar */
  showLabel?: boolean;
  /** Additional CSS classes for the root wrapper */
  className?: string;
}

const heightStyles = {
  4: "h-1",
  6: "h-1.5",
  8: "h-2",
} as const;

export function ProgressBar({
  percentage,
  height = 6,
  showLabel = false,
  className = "",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div className={`w-full ${className}`.trim()}>
      <div
        className={`w-full overflow-hidden rounded-full bg-border/30 ${heightStyles[height]}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-border transition-[width]"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="mt-1 block text-sm text-text-muted">{Math.round(clamped)}%</span>
      )}
    </div>
  );
}
