/**
 * StatCards (InsightCards)
 * Row of insight cards: Runs, Distance (+ equivalent), Weekly pace, Projected finish.
 */

import { getDistanceEquivalent } from "../../utils/distanceEquivalent";
import type { SnapshotStreet } from "../../types/api.types";

export interface StatCardsProps {
  activityCount: number;
  distanceCoveredMeters: number;
  streets: SnapshotStreet[];
  completedStreets: number;
  totalStreets: number;
}

function getPaceAndFinish(
  streets: SnapshotStreet[],
  completedStreets: number,
  totalStreets: number,
): {
  paceLabel: string;
  paceSubtitle: string;
  finishLabel: string;
} {
  const completedDates = streets
    .filter((s) => s.completed && s.lastRunDate)
    .map((s) => new Date(s.lastRunDate!).getTime());

  if (completedDates.length < 2) {
    return {
      paceLabel: "—",
      paceSubtitle: "Complete more runs",
      finishLabel: "Keep running!",
    };
  }

  const span = Math.max(...completedDates) - Math.min(...completedDates);
  const weeks = span / (7 * 24 * 60 * 60 * 1000);
  const streetsPerWeek = weeks > 0 ? completedDates.length / weeks : 0;

  const paceLabel =
    streetsPerWeek > 0 ? `${streetsPerWeek.toFixed(1)} streets/week` : "—";
  const paceSubtitle = "";

  const remaining = totalStreets - completedStreets;
  if (remaining <= 0) {
    return { paceLabel, paceSubtitle, finishLabel: "Done!" };
  }

  const weeksLeft = streetsPerWeek > 0 ? remaining / streetsPerWeek : 0;
  const finishDate = new Date(Date.now() + weeksLeft * 7 * 24 * 60 * 60 * 1000);
  const finishLabel =
    weeksLeft > 0
      ? finishDate.toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        })
      : "Keep running!";

  return { paceLabel, paceSubtitle, finishLabel };
}

export function StatCards({
  activityCount,
  distanceCoveredMeters,
  streets,
  completedStreets,
  totalStreets,
}: StatCardsProps) {
  const distanceKm = distanceCoveredMeters / 1000;
  const equivalent = getDistanceEquivalent(distanceKm);
  const { paceLabel, paceSubtitle, finishLabel } = getPaceAndFinish(
    streets,
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
