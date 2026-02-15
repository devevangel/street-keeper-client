/**
 * Last run / today's highlight. Shows last run summary whenever user has activity (any age).
 */
import type { HomepagePayload } from "../../services/homepage.service";

interface TodaysHighlightProps {
  highlights: HomepagePayload["recentHighlights"] | null | undefined;
  lastRun: HomepagePayload["lastRun"] | null | undefined;
}

function formatDaysAgo(daysAgo: number): string {
  if (daysAgo <= 0) return "today";
  if (daysAgo === 1) return "1 day ago";
  return `${daysAgo} days ago`;
}

export function TodaysHighlight({ highlights, lastRun }: TodaysHighlightProps) {
  if (lastRun) {
    const dateLabel = formatDaysAgo(lastRun.daysAgo);
    const distance = lastRun.distanceKm.toFixed(1);
    const line =
      highlights && highlights.newStreets > 0
        ? `Last run: ${dateLabel} · ${highlights.newStreets} new streets, ${distance} km`
        : `Last run: ${dateLabel} · ${distance} km`;
    return (
      <p className="text-text-muted text-sm" data-highlight="last-run">
        {line}
      </p>
    );
  }
  if (highlights && (highlights.newStreets > 0 || highlights.distanceKm > 0)) {
    const line =
      highlights.newStreets > 0
        ? `Last run: ${highlights.newStreets} new streets, ${highlights.distanceKm.toFixed(1)} km`
        : `Last run: ${highlights.distanceKm.toFixed(1)} km`;
    return (
      <p className="text-text-muted text-sm" data-highlight="recent-run">
        {line}
      </p>
    );
  }
  return null;
}
