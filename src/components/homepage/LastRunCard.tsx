/**
 * LastRunCard
 * Compact summary for the most recent run with optional map focus action.
 */

import { useFormatters } from "../../contexts/PreferencesContext";
import { Button, Card, SectionHeading } from "../common";
import type { HomepagePayload } from "../../services/homepage.service";

interface LastRunCardProps {
  homepage: HomepagePayload;
  onShowOnMap: (activityId: string, bbox: [number, number, number, number]) => void;
}

function formatDaysAgo(daysAgo: number): string {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return `${daysAgo}d ago`;
  if (daysAgo < 14) return "1w ago";
  const weeks = Math.floor(daysAgo / 7);
  return `${weeks}w ago`;
}

export function LastRunCard({ homepage, onShowOnMap }: LastRunCardProps) {
  const { formatDistance } = useFormatters();
  if (!homepage.lastRun) return null;

  return (
    <Card padding="none" className="w-full p-3">
      <SectionHeading>Last run</SectionHeading>
      <p className="text-xl font-bold leading-tight text-text">
        {formatDaysAgo(homepage.lastRun.daysAgo)} ·{" "}
        {formatDistance(homepage.lastRun.distanceKm * 1000)}
        {homepage.lastRun.newStreets > 0 ? ` · +${homepage.lastRun.newStreets} streets` : ""}
      </p>
      {homepage.lastRun.activityId && homepage.lastRun.bbox ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-2 text-xs"
          onClick={() => onShowOnMap(homepage.lastRun!.activityId!, homepage.lastRun!.bbox!)}
        >
          Show on map
        </Button>
      ) : null}
      {homepage.lastRun.completedStreetNames?.length ||
      homepage.lastRun.improvedStreetNames?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {homepage.lastRun.completedStreetNames?.map((name) => (
            <span
              key={`c-${name}`}
              className="inline-block rounded border border-border bg-surface px-1.5 py-0.5 text-xs text-text"
            >
              {name}
            </span>
          ))}
          {homepage.lastRun.improvedStreetNames?.map((name) => (
            <span
              key={`i-${name}`}
              className="inline-block rounded border border-border bg-surface px-1.5 py-0.5 text-xs text-text-muted"
            >
              {name}
            </span>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
