import { useMemo } from "react";
import { Card, SectionHeading } from "../common";
import { getStreetBin, type FilterStatus } from "../../utils/street-filters";

export const ALL_BINS: FilterStatus[] = [
  "completed",
  "almostThere",
  "inProgress",
  "notStarted",
];

export const BIN_CONFIG: {
  key: FilterStatus;
  color: string;
  activeBg: string;
  label: string;
  description: string;
}[] = [
  { key: "completed", color: "bg-success", activeBg: "bg-success/15 ring-success/40 text-success", label: "Done", description: "100%" },
  { key: "almostThere", color: "bg-amber-500", activeBg: "bg-amber-500/15 ring-amber-500/40 text-amber-600 dark:text-amber-400", label: "Almost done", description: "50%+" },
  { key: "inProgress", color: "bg-cyan-500", activeBg: "bg-cyan-500/15 ring-cyan-500/40 text-cyan-600 dark:text-cyan-400", label: "Just started", description: "1–49%" },
  { key: "notStarted", color: "bg-neutral-400 dark:bg-neutral-500", activeBg: "bg-neutral-400/15 ring-neutral-400/40 text-text-muted", label: "To go", description: "Not run yet" },
];

interface StreetLike {
  status?: string;
  percentage?: number;
}

export interface MapFilterCardProps {
  streets: StreetLike[];
  visibleBins: Set<FilterStatus>;
  onToggleBin: (bin: FilterStatus) => void;
  onToggleAll: () => void;
  allBinsActive: boolean;
  showTraces: boolean;
  onToggleTraces: () => void;
  /** Bins to hide from the UI (still counted, just not shown as toggles) */
  hiddenBins?: FilterStatus[];
}

export function MapFilterCard({
  streets,
  visibleBins,
  onToggleBin,
  onToggleAll,
  allBinsActive,
  showTraces,
  onToggleTraces,
  hiddenBins = [],
}: MapFilterCardProps) {
  const binCounts = useMemo(() => {
    const counts = { completed: 0, almostThere: 0, inProgress: 0, notStarted: 0 };
    for (const s of streets) {
      const completed = s.status === "completed";
      const bin = getStreetBin(s.percentage ?? 0, completed);
      if (bin !== "all") counts[bin]++;
    }
    return counts;
  }, [streets]);

  const noneActive = visibleBins.size === 0;

  if (streets.length === 0) return null;

  return (
    <Card padding="none" className="w-full p-3">
      <div className="flex items-center justify-between">
        <SectionHeading>Streets on map</SectionHeading>
        <button
          type="button"
          className="text-[11px] font-medium text-text-muted underline decoration-border underline-offset-2 hover:text-text"
          onClick={onToggleAll}
        >
          {allBinsActive ? "Hide all" : "Show all"}
        </button>
      </div>
      <p className="mb-2.5 text-[11px] text-text-muted">
        Toggle which streets appear on the map
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {BIN_CONFIG.filter(({ key }) => !hiddenBins.includes(key)).map(({ key, color, activeBg, label, description }) => {
          const active = visibleBins.has(key);
          const count = binCounts[key as keyof typeof binCounts];
          return (
            <button
              key={key}
              type="button"
              className={`group flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-all ${
                active
                  ? `${activeBg} ring-1 ring-inset`
                  : "bg-bg text-text-muted/60 hover:bg-bg/80"
              }`}
              onClick={() => onToggleBin(key)}
            >
              <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${active ? `${color} border-transparent` : "border-neutral-300 dark:border-neutral-600"}`}>
                {active && (
                  <svg viewBox="0 0 16 16" className="size-3 text-white">
                    <path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-tight">
                  {count} <span className="font-semibold">street{count !== 1 ? "s" : ""}</span>
                </span>
                <span className={`block text-[11px] leading-tight ${active ? "" : "text-text-muted/50"}`}>
                  {label} · {description}
                </span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          className={`col-span-2 flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all ${
            showTraces
              ? "bg-violet-500/15 ring-1 ring-inset ring-violet-500/40 text-violet-600 dark:text-violet-400"
              : "bg-bg text-text-muted/60 hover:bg-bg/80"
          }`}
          onClick={onToggleTraces}
        >
          <span className={`flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${showTraces ? "border-transparent bg-violet-500" : "border-neutral-300 dark:border-neutral-600"}`}>
            {showTraces && (
              <svg viewBox="0 0 16 16" className="size-3 text-white">
                <path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold leading-tight">Run traces</span>
            <span className={`block text-[11px] leading-tight ${showTraces ? "" : "text-text-muted/50"}`}>
              Strava GPS lines
            </span>
          </span>
        </button>
      </div>
      {noneActive && !showTraces && (
        <p className="mt-2 text-center text-[11px] text-text-muted/70">
          All map layers hidden
        </p>
      )}
    </Card>
  );
}
