/**
 * ProjectStats
 * Stats panel for project detail: total, completed, in-progress, not started, completion %.
 */

import { Card } from "../common";

export interface ProjectStatsProps {
  totalStreets: number;
  completedStreets: number;
  inProgressCount: number;
  notStartedCount: number;
  progress: number;
}

export function ProjectStats({
  totalStreets,
  completedStreets,
  inProgressCount,
  notStartedCount,
  progress,
}: ProjectStatsProps) {
  const progressPercent = Math.round(progress);

  return (
    <Card>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
        Progress
      </h3>
      <div className="flex items-center gap-2">
        <div
          className="h-3 flex-1 overflow-hidden rounded bg-border"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progressPercent}% complete`}
        >
          <div
            className="h-full bg-success transition-all"
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
        <span className="text-base font-bold text-text">
          {progressPercent}%
        </span>
      </div>
      <ul className="mt-3 list-none space-y-1 p-0 text-sm text-text-muted">
        <li>
          <span className="font-medium text-text">{totalStreets}</span> total
          streets
        </li>
        <li>
          <span className="font-medium text-success">{completedStreets}</span>{" "}
          completed
        </li>
        <li>
          <span className="font-medium text-text">{inProgressCount}</span> in
          progress
        </li>
        <li>
          <span className="font-medium text-text-muted">{notStartedCount}</span>{" "}
          not started
        </li>
      </ul>
    </Card>
  );
}
