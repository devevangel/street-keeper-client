/**
 * ProgressHero
 * Large progress percentage with progress bar and milestone hint.
 */

function milestonePhrase(target: number): string {
  if (target === 25) return "a quarter of the way there";
  if (target === 50) return "halfway there";
  if (target === 75) return "three-quarters of the way there";
  if (target === 100) return "all the way";
  return `${target}%`;
}

export interface ProgressHeroProps {
  progress: number;
  nextMilestone: {
    target: number;
    streetsNeeded: number;
    currentProgress: number;
  } | null;
  completedStreets: number;
  totalStreets: number;
  currentStreak?: number;
  longestStreak?: number;
}

export function ProgressHero({
  progress,
  nextMilestone,
  completedStreets,
  totalStreets,
  currentStreak = 0,
  longestStreak = 0,
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
          Just {nextMilestone.streetsNeeded} more street
          {nextMilestone.streetsNeeded !== 1 ? "s" : ""} and you&apos;ll be{" "}
          {milestonePhrase(nextMilestone.target)}!
        </p>
      )}
      <p className="mt-1 text-center text-xs text-text-muted">
        {completedStreets} of {totalStreets} streets completed
      </p>
      {currentStreak > 0 && (
        <p className="mt-2 text-center text-success text-sm">
          You have run {currentStreak} day{currentStreak !== 1 ? "s" : ""} in a
          row!
        </p>
      )}
      {longestStreak > 0 && currentStreak === 0 && (
        <p className="mt-1 text-center text-text-muted text-xs">
          Your longest streak: {longestStreak} days
        </p>
      )}
    </div>
  );
}
