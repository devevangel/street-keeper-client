/**
 * MapStats Component
 * Hero-style stats for the home page: completion %, length with progress,
 * summary counts, and a small completed vs in-progress bar.
 */

import { usePreferences } from "../../contexts/PreferencesContext";

interface MapStatsProps {
  /** Total streets returned in the area */
  totalStreets: number;
  /** Streets with status completed (green) */
  completedCount: number;
  /** Streets with status partial (yellow) */
  partialCount: number;
  /** Total length in meters of segments with progress (optional, computed from segments) */
  totalLengthMeters?: number;
}

export function MapStats({
  totalStreets,
  completedCount,
  partialCount,
  totalLengthMeters = 0,
}: MapStatsProps) {
  const preferences = usePreferences();
  const formatDistance = preferences?.formatDistance ?? ((m: number, p = 1) => `${(m / 1000).toFixed(p)} km`);
  const completionPercent =
    totalStreets > 0
      ? Math.round((completedCount / totalStreets) * 100)
      : 0;

  return (
    <div
      className="space-y-3 border-b-2 border-border pb-4"
      aria-label="Street summary"
    >
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <div>
          <p className="text-2xl font-bold text-text tabular-nums">
            {completionPercent}%
          </p>
          <p className="text-sm text-text-muted">
            of streets in this area completed
          </p>
        </div>
        {totalLengthMeters > 0 && (
          <div>
            <p className="text-2xl font-bold text-text tabular-nums">
              {formatDistance(totalLengthMeters, 1)}
            </p>
            <p className="text-sm text-text-muted">
              of streets with progress
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="text-text-muted">
          <span className="font-bold text-text">{totalStreets}</span> streets in
          this area
        </span>
        <span className="font-bold text-success">{completedCount} completed</span>
        <span className="font-bold text-warning">{partialCount} in progress</span>
      </div>
      {totalStreets > 0 && (
        <div
          className="flex h-2 overflow-hidden rounded bg-border"
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={totalStreets}
          aria-label={`${completedCount} of ${totalStreets} streets completed`}
        >
          <div
            className="bg-success transition-all"
            style={{
              width: `${completionPercent}%`,
            }}
          />
          <div
            className="bg-warning transition-all"
            style={{
              width: `${totalStreets > 0 ? Math.round((partialCount / totalStreets) * 100) : 0}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
