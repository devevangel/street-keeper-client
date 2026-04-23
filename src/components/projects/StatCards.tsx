/**
 * StatCards (InsightCards)
 * Row of insight cards: Runs, Distance (+ equivalent), Weekly pace, Projected finish.
 * Pace and projected finish are server-computed to avoid frontend numeric bugs.
 */

import { useFormatters } from "../../contexts/PreferencesContext";
import { getDistanceEquivalent } from "../../utils/distanceEquivalent";

export interface StatCardsProps {
  activityCount: number;
  distanceCoveredMeters: number;
  /** Server-computed: streets per week (safe math) */
  streetsPerWeek: number;
  /** Server-computed: ISO date string or null */
  projectedFinishDate: string | null;
  completedStreets: number;
  totalStreets: number;
  /** Streets newly completed this calendar month (user timezone) */
  streetsThisMonth: number;
  /** e.g. "April 2026" */
  monthLabel: string;
}

function formatPaceAndFinish(
  streetsPerWeek: number,
  projectedFinishDate: string | null,
  completedStreets: number,
  totalStreets: number,
): { paceLabel: string; paceSubtitle: string; finishLabel: string } {
  const paceLabel =
    streetsPerWeek > 0 ? `${streetsPerWeek.toFixed(1)} streets/week` : "—";
  const paceSubtitle = "";
  const remaining = totalStreets - completedStreets;
  if (remaining <= 0) {
    return { paceLabel, paceSubtitle, finishLabel: "Done!" };
  }
  const finishLabel =
    projectedFinishDate != null
      ? new Date(projectedFinishDate).toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        })
      : "Keep running!";
  return { paceLabel, paceSubtitle, finishLabel };
}

export function StatCards({
  activityCount,
  distanceCoveredMeters,
  streetsPerWeek,
  projectedFinishDate,
  completedStreets,
  totalStreets,
  streetsThisMonth,
  monthLabel,
}: StatCardsProps) {
  const { formatDistance } = useFormatters();
  const distanceKm = distanceCoveredMeters / 1000;
  const equivalent = getDistanceEquivalent(distanceKm);
  const { paceLabel, paceSubtitle, finishLabel } = formatPaceAndFinish(
    streetsPerWeek,
    projectedFinishDate,
    completedStreets,
    totalStreets,
  );

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
      <div className="rounded border-2 border-border bg-surface p-3 text-center">
        <div className="text-xl font-bold tabular-nums text-text">
          {streetsThisMonth}
        </div>
        <div className="text-[10px] leading-tight text-text-muted">
          This month{monthLabel ? ` · ${monthLabel}` : ""}
        </div>
        <div className="text-xs text-text-muted">Streets completed</div>
      </div>
      <div className="rounded border-2 border-border bg-surface p-3 text-center">
        <div className="text-xl font-bold text-text">
          {activityCount > 0 ? activityCount : "—"}
        </div>
        <div className="text-xs text-text-muted">Runs in this project</div>
      </div>
      <div className="rounded border-2 border-border bg-surface p-3 text-center">
        <div className="text-xl font-bold text-text">
          {formatDistance(distanceCoveredMeters, 1)}
        </div>
        {equivalent && (
          <div className="text-[10px] text-text-muted">
            That&apos;s {equivalent}
          </div>
        )}
        <div className="text-xs text-text-muted">Distance covered</div>
      </div>
      <div className="rounded border-2 border-border bg-surface p-3 text-center">
        <div className="text-xl font-bold text-text">{paceLabel}</div>
        {paceSubtitle && (
          <div className="text-[10px] text-text-muted">{paceSubtitle}</div>
        )}
        <div className="text-xs text-text-muted">Weekly pace</div>
      </div>
      <div className="rounded border-2 border-border bg-surface p-3 text-center">
        <div className="text-xl font-bold text-success">{finishLabel}</div>
        <div className="text-xs text-text-muted">Projected finish</div>
      </div>
    </div>
  );
}
