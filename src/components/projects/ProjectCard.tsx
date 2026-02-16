/**
 * ProjectCard
 * Card for project list: name, progress bar, street counts, area info.
 * Links to project detail page.
 */

import { Link } from "react-router-dom";
import { Card } from "../common";
import type { ProjectListItem } from "../../types/api.types";

export interface ProjectCardProps {
  project: ProjectListItem;
}

function formatRadius(meters: number): string {
  if (meters >= 1000) return `${meters / 1000} km`;
  return `${meters} m`;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const progressPercent = Math.round(project.progress);
  const areaLabel = formatRadius(project.radiusMeters);
  // Use street names if available (matches detail page), otherwise fall back to segments
  const totalStreets = project.totalStreetNames ?? project.totalStreets;
  const completedStreets = project.completedStreetNames ?? project.completedStreets;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block text-inherit no-underline hover:opacity-95"
      aria-label={`View project ${project.name}`}
    >
      <Card className="transition-shadow hover:shadow-md">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-text">{project.name}</h3>
          <p className="text-sm text-text-muted">
            {completedStreets} / {totalStreets} streets ·{" "}
            {areaLabel} radius
          </p>
          <div className="flex items-center gap-2">
            <div
              className="h-2 flex-1 overflow-hidden rounded bg-border"
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
            <span className="text-sm font-medium text-text">
              {progressPercent}%
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
