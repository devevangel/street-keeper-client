import { Button, Card, SectionHeading } from "../common";
import type { HomepagePayload } from "../../services/homepage.service";

function formatDaysAgo(daysAgo: number): string {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return `${daysAgo}d ago`;
  if (daysAgo < 14) return "1w ago";
  const weeks = Math.floor(daysAgo / 7);
  return `${weeks}w ago`;
}

function formatRunRecency(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "";
  const daysAgo = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000)),
  );
  return formatDaysAgo(daysAgo);
}

export interface RecentRunsProps {
  lastRun?: HomepagePayload["lastRun"];
  runs?: NonNullable<HomepagePayload["recentRuns"]>;
  onSelect: (activityId: string, bbox: [number, number, number, number]) => void;
}

export function RecentRuns({ lastRun, runs, onSelect }: RecentRunsProps) {
  const otherRuns = (runs ?? [])
    .filter((r) => r.activityId !== lastRun?.activityId)
    .slice(0, 3);

  if (!lastRun && otherRuns.length === 0) return null;

  return (
    <Card padding="none" className="w-full p-3">
      <SectionHeading>Your runs</SectionHeading>

      {lastRun && (
        <div className="mb-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-lg font-bold leading-tight text-text">
              {formatDaysAgo(lastRun.daysAgo)} · {lastRun.distanceKm} km
            </p>
            {lastRun.newStreets > 0 && (
              <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                +{lastRun.newStreets} street{lastRun.newStreets !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {(lastRun.completedStreetNames?.length ||
            lastRun.improvedStreetNames?.length) ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {lastRun.completedStreetNames?.map((name) => (
                <span
                  key={`c-${name}`}
                  className="inline-block rounded bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success"
                >
                  {name}
                </span>
              ))}
              {lastRun.improvedStreetNames?.map((name) => (
                <span
                  key={`i-${name}`}
                  className="inline-block rounded bg-border/40 px-1.5 py-0.5 text-xs text-text-muted"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : null}
          {lastRun.activityId && lastRun.bbox ? (
            <button
              type="button"
              className="mt-1.5 text-xs font-medium text-text-muted underline decoration-border underline-offset-2 hover:text-text"
              onClick={() => onSelect(lastRun.activityId!, lastRun.bbox!)}
            >
              Show on map
            </button>
          ) : null}
        </div>
      )}

      {otherRuns.length > 0 && (
        <ul className={`divide-y divide-border/40 ${lastRun ? "mt-2 border-t border-border/40 pt-1" : ""}`}>
          {otherRuns.map((r) => (
            <li key={r.activityId}>
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start px-0 py-1.5 text-left text-xs font-normal text-text"
                onClick={() => onSelect(r.activityId, r.bbox)}
              >
                <span className="font-medium text-text">{r.name}</span>
                <span className="text-text-muted"> · </span>
                <span className="text-text-muted">{r.distanceKm} km</span>
                {formatRunRecency(r.date) && (
                  <>
                    <span className="text-text-muted"> · </span>
                    <span className="text-text-muted">{formatRunRecency(r.date)}</span>
                  </>
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
