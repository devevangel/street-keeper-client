import { ChevronRight, Eye } from "lucide-react";
import { useFormatters } from "../../contexts/PreferencesContext";
import { Card, SectionHeading } from "../common";
import type { HomepagePayload } from "../../services/homepage.service";
import { isUnnamedStreet } from "../../utils/street-filters";

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
  const { formatDistance } = useFormatters();
  const otherRuns = (runs ?? [])
    .filter((r) => r.activityId !== lastRun?.activityId)
    .slice(0, 3);

  if (!lastRun && otherRuns.length === 0) return null;

  const canClickLastRun = !!(lastRun?.activityId && lastRun?.bbox);

  return (
    <Card padding="none" className="w-full p-3">
      <SectionHeading>Your runs</SectionHeading>

      {lastRun && (
        <button
          type="button"
          disabled={!canClickLastRun}
          className={`group mb-1 w-full rounded-lg text-left transition-colors ${
            canClickLastRun
              ? "cursor-pointer px-2 py-1.5 hover:bg-border/30 active:bg-border/50"
              : ""
          }`}
          onClick={() => {
            if (canClickLastRun) onSelect(lastRun.activityId!, lastRun.bbox!);
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-bold leading-tight text-text">
              {formatDaysAgo(lastRun.daysAgo)} ·{" "}
              {formatDistance(lastRun.distanceKm * 1000)}
            </p>
            <div className="flex items-center gap-1.5">
              {lastRun.newStreets > 0 && (
                <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                  +{lastRun.newStreets} street{lastRun.newStreets !== 1 ? "s" : ""}
                </span>
              )}
              {canClickLastRun && (
                <ChevronRight className="size-4 text-text-muted/50 transition-transform group-hover:translate-x-0.5 group-hover:text-text" />
              )}
            </div>
          </div>
          {(lastRun.completedStreetNames?.filter((n) => !isUnnamedStreet(n)).length ||
            lastRun.improvedStreetNames?.filter((n) => !isUnnamedStreet(n)).length) ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {lastRun.completedStreetNames?.filter((n) => !isUnnamedStreet(n)).map((name) => (
                <span
                  key={`c-${name}`}
                  className="inline-block rounded bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success"
                >
                  {name}
                </span>
              ))}
              {lastRun.improvedStreetNames?.filter((n) => !isUnnamedStreet(n)).map((name) => (
                <span
                  key={`i-${name}`}
                  className="inline-block rounded bg-border/40 px-1.5 py-0.5 text-xs text-text-muted"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : null}
          {canClickLastRun && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-text-muted opacity-70 transition-opacity group-hover:opacity-100">
              <Eye className="size-3" />
              Show on map
            </span>
          )}
        </button>
      )}

      {otherRuns.length > 0 && (
        <ul className={`divide-y divide-border/40 ${lastRun ? "mt-2 border-t border-border/40 pt-1" : ""}`}>
          {otherRuns.map((r) => (
            <li key={r.activityId}>
              <button
                type="button"
                className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-border/30 active:bg-border/50"
                onClick={() => onSelect(r.activityId, r.bbox)}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-text">{r.name}</span>
                  <span className="ml-1.5 text-xs text-text-muted">
                    {formatDistance(r.distanceKm * 1000)}
                  </span>
                  {formatRunRecency(r.date) && (
                    <span className="ml-1.5 text-xs text-text-muted">
                      {formatRunRecency(r.date)}
                    </span>
                  )}
                </div>
                <ChevronRight className="size-4 shrink-0 text-text-muted/40 transition-transform group-hover:translate-x-0.5 group-hover:text-text" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
