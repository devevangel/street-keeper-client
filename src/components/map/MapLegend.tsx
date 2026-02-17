/**
 * MapLegendFilter Component
 * Interactive legend overlay: click status rows to toggle street visibility.
 * Uses MAP_COLORS for consistent styling across homepage and project maps.
 */

import { MAP_COLORS } from "./mapConstants";

export type StreetStatus = "completed" | "partial" | "not_started";

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

interface MapLegendFilterProps {
  /** Which statuses are currently visible */
  visibleStatuses: Set<StreetStatus>;
  /** Toggle a status on/off */
  onToggle: (status: StreetStatus) => void;
  /** Which statuses to show in the legend (homepage has no "not_started") */
  availableStatuses?: StreetStatus[];
}

const DEFAULT_AVAILABLE: StreetStatus[] = [
  "completed",
  "partial",
  "not_started",
];

export function MapLegendFilter({
  visibleStatuses,
  onToggle,
  availableStatuses = DEFAULT_AVAILABLE,
}: MapLegendFilterProps) {
  return (
    <div
      className="absolute bottom-4 left-4 z-[1000] rounded border border-border bg-bg/95 px-3 py-2 text-xs shadow"
      aria-label="Map legend"
      role="group"
    >
      {availableStatuses.map((status) => {
        const config = STATUS_CONFIG[status];
        const isVisible = visibleStatuses.has(status);
        return (
          <button
            key={status}
            type="button"
            onClick={() => onToggle(status)}
            className={`mt-1.5 flex w-full cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-left transition first:mt-0 hover:bg-border/20 focus:outline-none focus:ring-1 focus:ring-border ${
              isVisible ? "opacity-100" : "opacity-50"
            }`}
            aria-pressed={isVisible}
            aria-label={`${config.label}: ${isVisible ? "visible" : "hidden"}. Click to toggle.`}
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
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
