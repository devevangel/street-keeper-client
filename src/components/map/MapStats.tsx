/**
 * MapStats Component
 * Summary stats for the home page map: total streets, completed count, partial count.
 * Uses design tokens for consistent styling.
 */

interface MapStatsProps {
  /** Total streets returned in the area */
  totalStreets: number;
  /** Streets with status completed (green) */
  completedCount: number;
  /** Streets with status partial (yellow) */
  partialCount: number;
}

export function MapStats({
  totalStreets,
  completedCount,
  partialCount,
}: MapStatsProps) {
  return (
    <div
      className="flex flex-wrap gap-4 border-b-2 border-border pb-4"
      aria-label="Street summary"
    >
      <p className="text-text-muted">
        <span className="font-bold text-text">{totalStreets}</span> streets in
        this area
      </p>
      <p className="font-bold text-success">{completedCount} completed</p>
      <p className="font-bold text-warning">{partialCount} in progress</p>
    </div>
  );
}
