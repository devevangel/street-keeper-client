/**
 * ProjectDetailPage
 * Project dashboard: progress hero, stat cards, charts, map links.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button, Card } from "../components/common";
import {
  ProgressHero,
  StatCards,
  ProgressTimeline,
  CompletionFunnel,
  RunImpactChart,
  StreetTypeBarChart,
  MapThumbnail,
  SuggestionsPanel,
} from "../components/projects";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { ROUTES } from "../config/constants";
import type { ProjectDetail, ProjectActivityItem } from "../types/api.types";

function formatLastRun(lastActivityDate: string | null): string {
  if (!lastActivityDate) return "No runs yet";
  const d = new Date(lastActivityDate);
  const now = new Date();
  const days = Math.floor(
    (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [activities, setActivities] = useState<ProjectActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<
    "refresh" | "archive" | null
  >(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await projectsService.getById(id);
      setProject(res.project);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load project",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (!id || !project) return;
    projectsService
      .getActivities(id)
      .then((res) => setActivities(res.activities));
  }, [id, project?.id]);

  const handleRefresh = async () => {
    if (!id) return;
    setActionLoading("refresh");
    try {
      const res = await projectsService.refresh(id);
      setProject(res.project);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to refresh streets",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    if (
      !window.confirm("Archive this project? It will be hidden from your list.")
    )
      return;
    setActionLoading("archive");
    try {
      await projectsService.delete(id);
      navigate(ROUTES.PROJECTS_LIST);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to archive project",
      );
      setActionLoading(null);
    }
  };

  if (!id) {
    return (
      <div className="p-4">
        <p className="text-danger">Missing project ID</p>
        <Link to={ROUTES.PROJECTS_LIST}>Back to projects</Link>
      </div>
    );
  }

  if (loading && !project) {
    return (
      <div className="p-4">
        <p className="text-text-muted">Loading project…</p>
      </div>
    );
  }

  if (error && !project) {
    return (
      <Card className="max-w-md">
        <p className="text-danger">{error}</p>
        <Button variant="secondary" onClick={fetchProject} className="mt-2">
          Retry
        </Button>
        <Link to={ROUTES.PROJECTS_LIST} className="mt-3 block">
          Back to projects
        </Link>
      </Card>
    );
  }

  if (!project) {
    return null;
  }

  const lastRunText = formatLastRun(project.lastActivityDate);
  const activityText =
    project.activityCount === 0
      ? "No activities"
      : `${project.activityCount} activities`;

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link
          to={ROUTES.PROJECTS_LIST}
          className="text-sm text-text-muted hover:underline"
        >
          Back to projects
        </Link>
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">{project.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={actionLoading !== null}
          >
            {actionLoading === "refresh" ? "Refreshing…" : "Refresh streets"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleArchive}
            disabled={actionLoading !== null}
          >
            {actionLoading === "archive" ? "Archiving…" : "Archive"}
          </Button>
        </div>
      </div>
      <p className="mb-4 text-text-muted text-sm">
        Last run: {lastRunText} · {activityText}
      </p>

      {project.refreshNeeded && (
        <Card padding="sm" className="mb-4 border-warning bg-warning/10">
          <p className="text-sm text-text">
            Street data is {project.daysSinceRefresh} days old. Consider
            refreshing to include new roads.
          </p>
        </Card>
      )}

      <details className="mb-4" open>
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted">
          Progress
        </summary>
        <div className="mt-1">
          <ProgressHero
            progress={project.progress}
            nextMilestone={project.nextMilestone}
            completedStreets={project.completedStreets}
            totalStreets={project.totalStreets}
          />
        </div>
      </details>

      <details className="mb-4" open>
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted">
          Key stats
        </summary>
        <div className="mt-1">
          <StatCards
            activityCount={project.activityCount}
            distanceCoveredMeters={project.distanceCoveredMeters}
            streets={project.streets}
            completedStreets={project.completedStreets}
            totalStreets={project.totalStreets}
          />
        </div>
      </details>

      <details className="mb-4" open>
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted">
          Progress over time
        </summary>
        <Card className="mt-1">
          <ProgressTimeline
            streets={project.streets}
            totalStreets={project.totalStreets}
          />
        </Card>
      </details>

      <details className="mb-4" open>
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted">
          Progress breakdown
        </summary>
        <div className="mt-1 grid gap-4 md:grid-cols-2">
          <Card>
            <CompletionFunnel streets={project.streets} />
          </Card>
          <MapThumbnail projectId={project.id} projectName={project.name} />
        </div>
      </details>

      <details className="mb-4" open>
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted">
          Run impact
        </summary>
        <Card className="mt-1">
          <RunImpactChart activities={activities} />
        </Card>
      </details>

      <details className="mb-4" open>
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted">
          Your next run
        </summary>
        <div className="mt-1">
          <SuggestionsPanel />
        </div>
      </details>

      <details className="mb-4">
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted">
          About this project
        </summary>
        <Card className="mt-1">
          <div className="flex flex-wrap gap-x-4 gap-y-1 p-3 text-sm text-text">
            <span>
              {project.radiusMeters >= 1000
                ? `${project.radiusMeters / 1000} km`
                : `${project.radiusMeters} m`}{" "}
              radius
            </span>
            <span>{project.totalStreets} streets</span>
            <span>
              {(project.totalLengthMeters / 1000).toFixed(1)} km total
            </span>
            <span>
              Snapshot {new Date(project.snapshotDate).toLocaleDateString()}
            </span>
          </div>
        </Card>
      </details>

      {project.streetsByType.length > 0 && (
        <details className="mb-4">
          <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted">
            Streets by type
          </summary>
          <Card className="mt-1">
            <StreetTypeBarChart data={project.streetsByType} />
          </Card>
        </details>
      )}
    </div>
  );
}
