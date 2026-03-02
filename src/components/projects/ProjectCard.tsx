/**
 * ProjectCard
 * Card for project list: name, progress bar, street counts, area info.
 * Links to project detail page.
 */

import { Link } from "react-router-dom";
import { Button, Card } from "../common";
import { usePreferences } from "../../contexts/PreferencesContext";
import type { ProjectListItem } from "../../types/api.types";

export interface ProjectCardProps {
  project: ProjectListItem;
  showActions?: boolean;
  onRestore?: () => void;
  onDelete?: () => void;
  actionLoading?: boolean;
}

export function ProjectCard({
  project,
  showActions,
  onRestore,
  onDelete,
  actionLoading,
}: ProjectCardProps) {
  const preferences = usePreferences();
  const formatRadius =
    preferences?.formatRadius ??
    ((m: number) => (m >= 1000 ? `${m / 1000} km` : `${m} m`));
  const progressPercent = Math.round(project.progress);
  const isCircle =
    project.boundaryType === "circle" && project.radiusMeters != null;
  const areaLabel = isCircle
    ? `${formatRadius(project.radiusMeters)} radius`
    : "Custom area";
  const totalStreets = project.totalStreetNames ?? project.totalStreets;
  const completedStreets = project.completedStreetNames ?? project.completedStreets;

  const cardContent = (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-text">{project.name}</h3>
        {project.isArchived && (
          <span className="shrink-0 rounded bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
            Archived
          </span>
        )}
      </div>
      <p className="text-sm text-text-muted">
        {completedStreets} / {totalStreets} streets · {areaLabel}
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
        <span className="text-sm font-medium text-text">{progressPercent}%</span>
      </div>
      {showActions && (
        <div className="mt-2 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRestore?.();
            }}
            disabled={actionLoading}
          >
            {actionLoading ? "…" : "Restore"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete?.();
            }}
            disabled={actionLoading}
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  );

  if (showActions) {
    return (
      <Card className="transition-shadow hover:shadow-md">{cardContent}</Card>
    );
  }

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block text-inherit no-underline hover:opacity-95"
      aria-label={`View project ${project.name}`}
    >
      <Card className="transition-shadow hover:shadow-md">{cardContent}</Card>
    </Link>
  );
}
