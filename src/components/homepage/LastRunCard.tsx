/**
 * LastRunCard
 * Last activity: time ago, distance, new streets — compact inline stats.
 */

import type { HomepagePayload } from "../../services/homepage.service";

interface LastRunCardProps {
  data: HomepagePayload;
}

function formatDaysAgo(daysAgo: number): string {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return `${daysAgo}d ago`;
  if (daysAgo < 14) return "1w ago";
  const weeks = Math.floor(daysAgo / 7);
  return `${weeks}w ago`;
}

export function LastRunCard({ data }: LastRunCardProps) {
  const lastRun = data.lastRun;
  if (!lastRun) return null;

  return (
    <div className="rounded-lg border-2 border-border bg-surface p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Last run
      </h3>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-lg font-bold text-text">
          {lastRun.distanceKm.toFixed(1)} km
        </span>
        <span className="text-sm text-text-muted">
          {formatDaysAgo(lastRun.daysAgo)}
        </span>
      </div>
      {lastRun.newStreets > 0 && (
        <p className="mt-1 text-sm font-medium text-success">
          +{lastRun.newStreets} new street{lastRun.newStreets !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
