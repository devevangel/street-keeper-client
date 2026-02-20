/**
 * ActivityFeed
 * Compact list of recent runs: name, date, streets completed/improved. Max 5 items.
 */

import { usePreferences } from "../../contexts/PreferencesContext";
import type { ProjectActivityItem } from "../../types/api.types";

export interface ActivityFeedProps {
  activities: ProjectActivityItem[];
  maxItems?: number;
  className?: string;
}

export function ActivityFeed({
  activities,
  maxItems = 5,
  className = "",
}: ActivityFeedProps) {
  const preferences = usePreferences();
  const prefFormatDate = preferences?.formatDate ?? ((d: Date | string) => new Date(d).toLocaleDateString());

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return prefFormatDate(d);
  }
  const shown = activities.slice(0, maxItems);
  const hasMore = activities.length > maxItems;

  if (activities.length === 0) {
    return (
      <div
        className={`rounded border-2 border-border bg-surface p-4 text-center text-text-muted text-sm ${className}`}
      >
        Complete your first run to see your impact here
      </div>
    );
  }

  return (
    <div className={className}>
      <ul className="list-none space-y-2 p-0">
        {shown.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-baseline justify-between gap-2 rounded border border-border bg-surface px-3 py-2 text-sm"
          >
            <span className="font-medium text-text">{a.activityName}</span>
            <span className="text-text-muted text-xs">
              {formatDate(a.date)}
            </span>
            <span className="w-full text-text-muted text-xs sm:w-auto">
              {a.streetsCompleted} completed, {a.streetsImproved} improved
            </span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <p className="mt-2 text-center text-text-muted text-xs">
          +{activities.length - maxItems} more run{activities.length - maxItems !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
