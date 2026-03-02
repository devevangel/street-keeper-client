/**
 * MapLegendFilter Component
 * Interactive legend overlay: click status rows to toggle street visibility.
 * Uses MAP_COLORS for consistent styling across homepage and project maps.
 */

import { MAP_COLORS } from "./mapConstants";
import type { FilterStatus } from "../../utils/street-filters";

export type StreetStatus = "completed" | "partial" | "not_started";

/** Legend entries matching filter pill colors for polylines */
const PILL_LEGEND_ENTRIES = [
  { key: "completed", label: "Completed", color: MAP_COLORS.COMPLETED, dashed: false },
  { key: "almostThere", label: "Almost there", color: MAP_COLORS.ALMOST_THERE, dashed: true },
  { key: "inProgress", label: "In progress", color: MAP_COLORS.IN_PROGRESS, dashed: true },
  { key: "notStarted", label: "Not started", color: MAP_COLORS.NOT_RUN, dashed: true },
] as const;

const STATUS_CONFIG: Record<
  StreetStatus,
  { label: string; color: string; dashed: boolean }
> = {
  completed: {
    label: "Completed",
    color: MAP_COLORS.COMPLETED,
    dashed: false,
  },
  partial: {
    label: "Partial",
    color: MAP_COLORS.PARTIAL,
    dashed: true,
  },
  not_started: {
    label: "Not run",
    color: MAP_COLORS.NOT_RUN,
    dashed: true,
  },
};

/** Read-only legend guide: shows all polyline colors matching filter pills. */
export function MapLegendGuide() {
  return (
    <div
      className="absolute bottom-4 left-4 z-[1000] rounded border border-border bg-bg/95 px-3 py-2 text-xs shadow"
      aria-label="Map legend"
      role="group"
    >
      {PILL_LEGEND_ENTRIES.map(({ key, label, color, dashed }) => (
        <div
          key={key}
          className="mt-1.5 flex w-full items-center gap-2 px-1 py-0.5 first:mt-0"
        >
          <span
            className={`inline-block w-6 shrink-0 self-center ${
              dashed ? "h-0 border-b-2" : "h-1.5 rounded"
            }`}
            style={
              dashed
                ? {
                    borderColor: color,
                    borderStyle: "dashed",
                    opacity: 0.9,
                  }
                : { backgroundColor: color }
            }
          />
          <span className="text-text">{label}</span>
        </div>
      ))}
    </div>
  );
}

/** Enhanced legend that supports FilterStatus bins (completed, almostThere, inProgress, notStarted) */
interface MapLegendFilterBinsProps {
  /** Which bins are currently visible */
  visibleBins: Set<FilterStatus>;
  /** Toggle a bin on/off */
  onToggle: (bin: FilterStatus) => void;
  /** Optional counts for each bin (only display bins needed) */
  counts?: Partial<Record<FilterStatus, number>>;
  /** Callback to show all bins */
  onShowAll?: () => void;
}

const BIN_CONFIG: Record<FilterStatus, { label: string; color: string; dashed: boolean }> = {
  all: { label: "All", color: MAP_COLORS.COMPLETED, dashed: false },
  completed: { label: "Completed", color: MAP_COLORS.COMPLETED, dashed: false },
  almostThere: { label: "Almost there", color: MAP_COLORS.ALMOST_THERE, dashed: true },
  inProgress: { label: "In progress", color: MAP_COLORS.IN_PROGRESS, dashed: true },
  notStarted: { label: "Not started", color: MAP_COLORS.NOT_RUN, dashed: true },
};

const AVAILABLE_BINS: FilterStatus[] = ["completed", "almostThere", "inProgress", "notStarted"];

export function MapLegendFilterBins({
  visibleBins,
  onToggle,
  counts,
  onShowAll,
}: MapLegendFilterBinsProps) {
  const allVisible = AVAILABLE_BINS.every((bin) => visibleBins.has(bin));
  const hasHiddenBins = !allVisible;

  return (
    <div
      className="absolute bottom-4 left-4 z-[1000] rounded border border-border bg-bg/95 px-3 py-2 text-xs shadow"
      aria-label="Map legend"
      role="group"
    >
      {AVAILABLE_BINS.map((bin) => {
        const config = BIN_CONFIG[bin];
        const isVisible = visibleBins.has(bin);
        const count = counts?.[bin];
        const countText = count !== undefined ? ` (${count})` : "";

        return (
          <button
            key={bin}
            type="button"
            onClick={() => onToggle(bin)}
            className={`mt-1.5 flex w-full min-h-[32px] cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-left transition first:mt-0 hover:bg-border/20 focus:outline-none focus:ring-1 focus:ring-border ${
              isVisible ? "opacity-100" : "opacity-50"
            }`}
            aria-pressed={isVisible}
            aria-label={`${config.label}${countText}: ${isVisible ? "visible" : "hidden"}. Click to toggle.`}
          >
            <span
              className={`inline-block w-6 shrink-0 self-center ${
                config.dashed ? "h-0 border-b-2" : "h-1.5 rounded"
              }`}
              style={
                config.dashed
                  ? {
                      borderColor: config.color,
                      borderStyle: "dashed",
                      opacity: isVisible ? 0.9 : 0.5,
                    }
                  : { backgroundColor: config.color }
              }
            />
            <span
              className={`text-text ${!isVisible ? "line-through" : ""}`}
            >
              {config.label}{countText}
            </span>
          </button>
        );
      })}
      {hasHiddenBins && onShowAll && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-2 w-full rounded border border-border bg-surface px-2 py-1.5 text-xs font-medium text-text transition hover:bg-border/20 focus:outline-none focus:ring-1 focus:ring-border"
          aria-label="Show all street statuses"
        >
          Show all
        </button>
      )}
    </div>
  );
}

interface MapLegendFilterProps {
  /** Which statuses are currently visible */
  visibleStatuses: Set<StreetStatus>;
  /** Toggle a status on/off */
  onToggle: (status: StreetStatus) => void;
  /** Which statuses to show in the legend (homepage has no "not_started") */
  availableStatuses?: StreetStatus[];
  /** Optional counts for each status to display */
  counts?: Record<StreetStatus, number>;
  /** Callback to show all statuses */
  onShowAll?: () => void;
}

export const DEFAULT_AVAILABLE: StreetStatus[] = [
  "completed",
  "partial",
  "not_started",
];

export function MapLegendFilter({
  visibleStatuses,
  onToggle,
  availableStatuses = DEFAULT_AVAILABLE,
  counts,
  onShowAll,
}: MapLegendFilterProps) {
  const allVisible = availableStatuses.every((status) => visibleStatuses.has(status));
  const hasHiddenStatuses = !allVisible;

  return (
    <div
      className="absolute bottom-4 left-4 z-[1000] rounded border border-border bg-bg/95 px-3 py-2 text-xs shadow"
      aria-label="Map legend"
      role="group"
    >
      {availableStatuses.map((status) => {
        const config = STATUS_CONFIG[status];
        const isVisible = visibleStatuses.has(status);
        const count = counts?.[status];
        const countText = count !== undefined ? ` (${count})` : "";

        return (
          <button
            key={status}
            type="button"
            onClick={() => onToggle(status)}
            className={`mt-1.5 flex w-full min-h-[32px] cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-left transition first:mt-0 hover:bg-border/20 focus:outline-none focus:ring-1 focus:ring-border ${
              isVisible ? "opacity-100" : "opacity-50"
            }`}
            aria-pressed={isVisible}
            aria-label={`${config.label}${countText}: ${isVisible ? "visible" : "hidden"}. Click to toggle.`}
          >
            <span
              className={`inline-block w-6 shrink-0 self-center ${
                config.dashed ? "h-0 border-b-2" : "h-1.5 rounded"
              }`}
              style={
                config.dashed
                  ? {
                      borderColor: config.color,
                      borderStyle: "dashed",
                      opacity: isVisible ? 0.9 : 0.5,
                    }
                  : { backgroundColor: config.color }
              }
            />
            <span
              className={`text-text ${!isVisible ? "line-through" : ""}`}
            >
              {config.label}{countText}
            </span>
          </button>
        );
      })}
      {hasHiddenStatuses && onShowAll && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-2 w-full rounded border border-border bg-surface px-2 py-1.5 text-xs font-medium text-text transition hover:bg-border/20 focus:outline-none focus:ring-1 focus:ring-border"
          aria-label="Show all street statuses"
        >
          Show all
        </button>
      )}
    </div>
  );
}
