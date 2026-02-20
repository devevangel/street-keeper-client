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
  CompletionBinsPills,
  RunImpactChart,
  StreetTypeBarChart,
  MapThumbnail,
  SuggestionsPanel,
  WelcomeBanner,
  ActivityFeed,
  RadiusResizeModal,
  ProjectStreetList,
} from "../components/projects";
import { MilestonesSection } from "../components/milestones/MilestonesSection";
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
  const [radiusModalOpen, setRadiusModalOpen] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await projectsService.getById(id, { includeStreets: true });
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

  const handleResizeRadius = async (newRadiusMeters: number) => {
    if (!id) return;
    await projectsService.resize(id, newRadiusMeters);
    await fetchProject();
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
  const suggestionsUrl = ROUTES.PROJECT_SUGGESTIONS.replace(":id", project.id);
  const isCircle = (project as { boundaryType?: string }).boundaryType !== "polygon";
  const radiusLabel = isCircle && project.radiusMeters != null
    ? project.radiusMeters >= 1000
      ? `${project.radiusMeters / 1000} km`
      : `${project.radiusMeters} m`
    : "Custom area";

  return (
    <div className="p-4 text-base">
      <nav
        className="mb-4 flex items-center gap-2 text-sm text-text-muted"
        aria-label="Breadcrumb"
      >
        <Link to={ROUTES.PROJECTS_LIST} className="hover:underline">
          Projects
        </Link>
        <span aria-hidden>›</span>
        <span className="text-text" aria-current="page">
          {project.name}
        </span>
      </nav>

      <WelcomeBanner projectId={project.id} createdAt={project.createdAt} />

      {/* Header: name, radius badge, last run, actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-text">{project.name}</h1>
          <span className="rounded bg-border px-2 py-1 text-text-muted text-sm">
            {isCircle ? `${radiusLabel} radius` : radiusLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={actionLoading !== null}
            className="min-h-[44px]"
          >
            {actionLoading === "refresh" ? "Refreshing…" : "Refresh streets"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleArchive}
            disabled={actionLoading !== null}
            className="min-h-[44px]"
          >
            {actionLoading === "archive" ? "Archiving…" : "Archive"}
          </Button>
        </div>
      </div>
      <p className="mb-4 text-text-muted text-sm">
        Last run: {lastRunText}
        {project.activityCount > 0 && ` · ${project.activityCount} run${project.activityCount !== 1 ? "s" : ""}`}
      </p>

      {project.refreshNeeded && (
        <Card padding="sm" className="mb-4 border-warning bg-warning/10">
          <p className="text-sm text-text">
            Street data is {project.daysSinceRefresh} days old. Consider
            refreshing to include new roads.
          </p>
        </Card>
      )}

      {project.activityCount === 0 && (
        <Card className="mb-4 border-primary bg-primary/10">
          <p className="text-center font-medium text-text">
            Your streets are waiting. Lace up and go!
          </p>
          <Link to={suggestionsUrl} className="mt-3 flex justify-center">
            <Button className="min-h-[44px]">See suggested streets</Button>
          </Link>
        </Card>
      )}

      {/* Hero progress + CTA */}
      <Card className="mb-4">
        <ProgressHero
          progress={project.progress}
          nextMilestone={project.nextMilestone}
          completedStreets={project.completedStreets}
          totalStreets={project.totalStreets}
          completedStreetNames={project.completedStreetNames}
          totalStreetNames={project.totalStreetNames}
          currentStreak={project.currentStreak}
          longestStreak={project.longestStreak}
          realNextMilestone={project.realNextMilestone}
        />
        <Link to={suggestionsUrl} className="mt-3 block">
          <Button variant="secondary" size="sm" className="min-h-[44px]">
            See next streets to run
          </Button>
        </Link>
      </Card>

      {/* Quick stats */}
      <div className="mb-4">
        <StatCards
          activityCount={project.activityCount}
          distanceCoveredMeters={project.distanceCoveredMeters}
          streetsPerWeek={project.streetsPerWeek ?? 0}
          projectedFinishDate={project.projectedFinishDate ?? null}
          completedStreets={project.completedStreetNames ?? project.completedStreets}
          totalStreets={project.totalStreetNames ?? project.totalStreets}
        />
      </div>

      {/* Your next run - promoted */}
      <div className="mb-4">
        <SuggestionsPanel />
      </div>

      {/* Map preview */}
      <div className="mb-4">
        <MapThumbnail projectId={project.id} projectName={project.name} />
      </div>

      {/* Recent runs - compact list */}
      <div className="mb-4">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-text-muted">
          Recent runs
        </h3>
        <ActivityFeed activities={activities} maxItems={5} />
      </div>

      {/* All streets in this project */}
      <details className="mb-4">
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted min-h-[44px] flex items-center">
          All streets
        </summary>
        <Card className="mt-1">
          <ProjectStreetList
            streets={project.streets}
            totalStreets={project.totalStreets}
            totalLengthMeters={project.totalLengthMeters}
            overallProgressPercent={project.progress}
          />
        </Card>
      </details>

      {/* Goals & Milestones - Consolidated */}
      <MilestonesSection projectId={project.id} />

      {/* Collapsible details */}
      <details className="mb-4">
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted min-h-[44px] flex items-center">
          Progress over time
        </summary>
        <Card className="mt-1">
          <ProgressTimeline
            streets={project.streets}
            totalStreets={project.totalStreets}
          />
        </Card>
      </details>

      <details className="mb-4">
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted min-h-[44px] flex items-center">
          Progress breakdown
        </summary>
        <div className="mt-1 grid gap-4 md:grid-cols-2">
          <Card>
            <CompletionBinsPills bins={project.completionBins} />
          </Card>
          <MapThumbnail projectId={project.id} projectName={project.name} />
        </div>
      </details>

      <details className="mb-4">
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted min-h-[44px] flex items-center">
          Run impact (chart)
        </summary>
        <Card className="mt-1">
          <RunImpactChart activities={activities} />
        </Card>
      </details>

      <details className="mb-4">
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted min-h-[44px] flex items-center">
          About this project
        </summary>
        <Card className="mt-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm text-text">
            <span className="flex items-center gap-2">
              {isCircle ? `${radiusLabel} radius` : radiusLabel}
              {isCircle && project.radiusMeters != null && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setRadiusModalOpen(true);
                  }}
                  className="min-h-[44px] min-w-[44px] rounded border border-border px-2 py-1 text-primary hover:underline"
                >
                  Change
                </button>
              )}
            </span>
            <span>{project.totalStreetNames ?? project.totalStreets} streets</span>
            <span>
              {(project.totalLengthMeters / 1000).toFixed(1)} km total
            </span>
            <span>
              Street data last updated:{" "}
              {new Date(project.snapshotDate).toLocaleDateString()}
            </span>
          </div>
        </Card>
      </details>

      {isCircle && project.radiusMeters != null && (
        <RadiusResizeModal
          isOpen={radiusModalOpen}
          onClose={() => setRadiusModalOpen(false)}
          currentRadiusMeters={project.radiusMeters}
          onResize={handleResizeRadius}
        />
      )}

      {project.streetsByType.length > 0 && (
        <details className="mb-4">
          <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted min-h-[44px] flex items-center">
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
