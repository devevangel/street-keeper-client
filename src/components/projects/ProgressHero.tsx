/**
 * ProgressHero
 * Large progress percentage with progress bar and milestone hint.
 */

export interface ProgressHeroProps {
  progress: number;
  nextMilestone: {
    target: number;
    streetsNeeded: number;
    currentProgress: number;
  } | null;
  completedStreets: number;
  totalStreets: number;
}

export function ProgressHero({
  progress,
  nextMilestone,
  completedStreets,
  totalStreets,
}: ProgressHeroProps) {
  const percent = Math.round(Math.min(100, progress));

  return (
    <div className="rounded border-2 border-border bg-surface p-4">
      <div className="text-center">
        <span className="text-3xl font-bold text-text">{percent}%</span>
      </div>
      <div
        className="mt-2 h-3 overflow-hidden rounded bg-border"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percent}% complete`}
      >
        <div
          className="h-full bg-success transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      {nextMilestone && nextMilestone.streetsNeeded > 0 && (
        <p className="mt-2 text-center text-text-muted text-sm">
          {nextMilestone.streetsNeeded} street
          {nextMilestone.streetsNeeded !== 1 ? "s" : ""} to reach{" "}
          {nextMilestone.target}%!
        </p>
      )}
      <p className="mt-1 text-center text-xs text-text-muted">
        {completedStreets} of {totalStreets} streets completed
      </p>
    </div>
  );
}
