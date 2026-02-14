/**
 * StatCards (InsightCards)
 * Row of insight cards: Runs, Distance (+ equivalent), Weekly pace, Projected finish.
 * Pace and projected finish are server-computed to avoid frontend numeric bugs.
 */

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
}: StatCardsProps) {
  const distanceKm = distanceCoveredMeters / 1000;
  const equivalent = getDistanceEquivalent(distanceKm);
  const { paceLabel, paceSubtitle, finishLabel } = formatPaceAndFinish(
    streetsPerWeek,
    projectedFinishDate,
    completedStreets,
    totalStreets,
  );

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded border-2 border-border bg-surface p-3 text-center">
        <div className="text-xl font-bold text-text">
          {activityCount > 0 ? activityCount : "—"}
        </div>
        <div className="text-xs text-text-muted">Runs in this project</div>
      </div>
      <div className="rounded border-2 border-border bg-surface p-3 text-center">
        <div className="text-xl font-bold text-text">
          {distanceKm.toFixed(1)} km
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
