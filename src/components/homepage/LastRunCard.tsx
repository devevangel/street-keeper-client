/**
 * LastRunCard
 * Last activity: time ago, new streets, revisits, distance.
 */

import { Card } from "../common/Card";
import type { HomepagePayload } from "../../services/homepage.service";

interface LastRunCardProps {
  data: HomepagePayload;
}

function formatDaysAgo(daysAgo: number): string {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 14) return "1 week ago";
  const weeks = Math.floor(daysAgo / 7);
  return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
}

export function LastRunCard({ data }: LastRunCardProps) {
  const lastRun = data.lastRun;
  if (!lastRun) return null;

  return (
    <Card className="card-interactive space-y-2" padding="md">
      <h3 className="text-sm font-semibold text-text-muted">Last run</h3>
      <p className="text-base font-medium text-text">
        {formatDaysAgo(lastRun.daysAgo)}
      </p>
      <ul className="text-sm text-text-muted space-y-0.5">
        {lastRun.newStreets > 0 && (
          <li>{lastRun.newStreets} new street{lastRun.newStreets !== 1 ? "s" : ""} discovered!</li>
        )}
        <li>{lastRun.distanceKm.toFixed(1)} km</li>
      </ul>
    </Card>
  );
}
