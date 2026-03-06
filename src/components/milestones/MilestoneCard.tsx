/**
 * MilestoneCard Component (MVP)
 * Simple card showing progress toward a goal.
 */

interface MilestoneCardProps {
  milestone: {
    id: string;
    name: string;
    targetValue: number;
    currentValue: number;
    completedAt?: string;
    progressPercent?: number; // Optional pre-calculated percentage
  };
}

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  const progress = (milestone.currentValue / milestone.targetValue) * 100;
  const remaining = Math.max(0, milestone.targetValue - milestone.currentValue);
  const isComplete = milestone.completedAt != null;

  return (
    <div className="p-4 border-2 border-border rounded-lg bg-surface">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{isComplete ? "✓" : "○"}</span>
        <span className="font-medium text-text">{milestone.name}</span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-2 bg-border rounded overflow-hidden">
        <div
          className={`h-full rounded transition-all ${
            isComplete ? "bg-success" : "bg-primary"
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="mt-2 text-sm text-text-muted">
        {isComplete ? (
          <span>Completed!</span>
        ) : (
          <span>
            {Math.round(milestone.currentValue)}/{milestone.targetValue} (
            {Math.round(progress)}%) — {remaining} more to go
          </span>
        )}
      </div>
    </div>
  );
}
