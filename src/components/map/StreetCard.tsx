/**
 * StreetCard Component
 * Single street row with status indicator, name, percentage, and expandable stats.
 * Green dot = completed, yellow dot = partial. Click to expand/collapse stats.
 */

import type { MapStreet } from "../../types/api.types";

interface StreetCardProps {
  street: MapStreet;
  isExpanded: boolean;
  onToggle: () => void;
}

export function StreetCard({ street, isExpanded, onToggle }: StreetCardProps) {
  const isCompleted = street.status === "completed";

  return (
    <li className="border-2 border-border bg-surface">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-border/10"
        aria-expanded={isExpanded}
        aria-controls={`street-stats-${street.osmId}`}
        id={`street-trigger-${street.osmId}`}
      >
        <span
          className="h-3 w-3 shrink-0 rounded-full border-2 border-border"
          style={{
            backgroundColor: isCompleted
              ? "var(--color-success)"
              : "var(--color-warning)",
          }}
          aria-hidden
        />
        <span className="font-bold">{street.name}</span>
        <span className="text-text-muted text-sm">
          {street.percentage}% · {street.stats.runCount} run
          {street.stats.runCount !== 1 ? "s" : ""}
        </span>
      </button>
      {isExpanded && (
        <div
          id={`street-stats-${street.osmId}`}
          role="region"
          aria-labelledby={`street-trigger-${street.osmId}`}
          className="border-t-2 border-border px-4 py-3 text-sm text-text-muted"
        >
          <p>Type: {street.highwayType}</p>
          <p>Length: {Math.round(street.lengthMeters)} m</p>
          <p title="Number of sections this street is drawn as on the map (e.g. split by intersections)">
            Parts on map: {street.stats.segmentCount}
          </p>
          <p>Run count: {street.stats.runCount}</p>
          <p>Completed (full run): {street.stats.completionCount} time(s)</p>
          {street.stats.firstRunDate && (
            <p>
              First run:{" "}
              {new Date(street.stats.firstRunDate).toLocaleDateString()}
            </p>
          )}
          {street.stats.lastRunDate && (
            <p>
              Last run:{" "}
              {new Date(street.stats.lastRunDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
