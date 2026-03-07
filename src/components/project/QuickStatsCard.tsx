/**
 * QuickStatsCard
 * Project stats grid: total runs, distance, start date, last run.
 */

import { Card } from "../common/Card";
import type { ProjectMapProjectStats } from "../../types/api.types";

interface QuickStatsCardProps {
  stats: ProjectMapProjectStats;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function formatDaysAgo(iso: string | null): string {
  if (!iso) return "—";
  try {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 14) return "1 week ago";
    return `${Math.floor(days / 7)} weeks ago`;
  } catch {
    return "—";
  }
}

export function QuickStatsCard({ stats }: QuickStatsCardProps) {
  return (
    <Card className="card-interactive" padding="md">
      <h3 className="text-sm font-semibold text-text-muted mb-3">Quick stats</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-text-muted">Runs in this area</p>
          <p className="font-semibold text-text">{stats.totalRuns}</p>
        </div>
        <div>
          <p className="text-text-muted">Distance</p>
          <p className="font-semibold text-text">{stats.totalDistanceKm.toFixed(1)} km</p>
        </div>
        <div>
          <p className="text-text-muted">Started</p>
          <p className="font-medium text-text">{formatDate(stats.firstRunDate)}</p>
        </div>
        <div>
          <p className="text-text-muted">Last run</p>
          <p className="font-medium text-text">{formatDaysAgo(stats.lastRunDate)}</p>
        </div>
      </div>
    </Card>
  );
}
