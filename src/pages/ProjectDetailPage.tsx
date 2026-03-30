/**
 * ProjectDetailPage
 * Map on the left, data side panel on the right.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button, Card, ConfirmModal, ProgressBar, Skeleton } from "../components/common";
import { UnifiedMap } from "../components/map";
import { useGpsTraces } from "../hooks";
import { MAP_ZOOM } from "../components/map/mapConstants";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { ROUTES } from "../config/constants";
import { useToast } from "../contexts/ToastContext";
import type { ProjectDetail, ProjectMapData, ProjectQuickWin } from "../types/api.types";
import { computeBoundaryBbox, projectMapCenter } from "../utils/map-utils";

const MAP_SHELL_CENTER = { lat: 50.8, lng: -1.09 };
const EMPTY_HIGHLIGHT_OSM_IDS: string[] = [];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ProjectSidePanel({
  project,
  mapData,
  loading,
}: {
  project: ProjectDetail | null;
  mapData: ProjectMapData | null;
  loading: boolean;
}) {
  if (loading && !project) {
    return (
      <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto border-border bg-surface md:w-[380px] md:flex-none md:border-l">
        <div className="space-y-4 p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </aside>
    );
  }

  if (!project || !mapData) return null;

  const stats = mapData.stats;
  const pStats = mapData.projectStats;
  const pct = stats.completionPercentage;
  const quickWins = mapData.quickWins ?? [];

  return (
    <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto border-border bg-surface md:w-[380px] md:flex-none md:border-l">
      <div className="flex flex-col gap-4 p-4">
        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-text">{Math.round(pct)}%</span>
            <span className="text-sm text-text-muted">
              {stats.completedStreetNames} / {stats.totalStreetNames} streets
            </span>
          </div>
          <ProgressBar percentage={pct} height={6} />
          <div className="flex gap-4 text-xs text-text-muted">
            <span>{stats.completedStreets} completed</span>
            <span>{stats.partialStreets} in progress</span>
            <span>{stats.notRunStreets} not started</span>
          </div>
        </div>

        {/* Run stats */}
        {pStats && (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Run stats
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium text-text">{pStats.totalRuns}</p>
                <p className="text-xs text-text-muted">runs</p>
              </div>
              <div>
                <p className="font-medium text-text">{pStats.totalDistanceKm.toFixed(1)} km</p>
                <p className="text-xs text-text-muted">total distance</p>
              </div>
              <div>
                <p className="font-medium text-text">{formatDate(pStats.firstRunDate)}</p>
                <p className="text-xs text-text-muted">first run</p>
              </div>
              <div>
                <p className="font-medium text-text">{formatDate(pStats.lastRunDate)}</p>
                <p className="text-xs text-text-muted">last run</p>
              </div>
            </div>
          </div>
        )}

        {/* Pace & projection */}
        {project.streetsPerWeek > 0 && (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Pace
            </h3>
            <p className="text-sm text-text">
              <span className="font-medium">{project.streetsPerWeek.toFixed(1)}</span> streets/week
            </p>
            {project.projectedFinishDate && (
              <p className="text-xs text-text-muted">
                At this pace, done by {formatDate(project.projectedFinishDate)}
              </p>
            )}
          </div>
        )}

        {/* Quick wins */}
        <QuickWinsList quickWins={quickWins} />

        {/* Milestone */}
        {project.realNextMilestone && !project.realNextMilestone.progress.isCompleted && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Next milestone
            </h3>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-text">{project.realNextMilestone.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar
                  percentage={project.realNextMilestone.progress.ratio * 100}
                  height={4}
                  className="flex-1"
                />
                <span className="text-xs text-text-muted">
                  {Math.round(project.realNextMilestone.progress.ratio * 100)}%
                </span>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                {project.realNextMilestone.progress.currentValue} / {project.realNextMilestone.progress.targetValue} {project.realNextMilestone.progress.unit}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function QuickWinsList({ quickWins }: { quickWins: ProjectQuickWin[] }) {
  if (quickWins.length === 0) return null;
  const title =
    quickWins[0] != null && quickWins[0].percentage >= 75
      ? "Quick wins"
      : "Closest to done";
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h3>
      {quickWins.slice(0, 5).map((qw) => (
        <div key={qw.osmId} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text">{qw.name}</p>
            <p className="text-xs text-text-muted">
              {Math.round(qw.remainingMeters)}m left
            </p>
          </div>
          <span className="ml-2 shrink-0 text-sm font-medium text-text-muted">
            {Math.round(qw.percentage)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [mapData, setMapData] = useState<ProjectMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const toast = useToast();

  const { traces: gpsTraces } = useGpsTraces({ projectId: id ?? null });

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [projectRes, mapRes] = await Promise.all([
        projectsService.getById(id, { includeStreets: true }),
        projectsService.getMap(id),
      ]);
      if (signal?.aborted) return;
      setProject(projectRes.project);
      setMapData(mapRes.map);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof ApiError ? err.message : "Failed to load project");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const doArchive = useCallback(async () => {
    if (!id) return;
    setArchiving(true);
    try {
      await projectsService.archive(id);
      toast?.showToast("Project archived", "success");
      navigate(ROUTES.PROJECTS_LIST);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to archive project";
      setError(msg);
      toast?.showToast(msg, "error");
      setArchiving(false);
    }
  }, [id, navigate, toast]);

  const doRestore = useCallback(async () => {
    if (!id) return;
    setRestoring(true);
    try {
      await projectsService.restore(id);
      toast?.showToast("Project restored", "success");
      await fetchData();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to restore project";
      toast?.showToast(msg, "error");
    } finally {
      setRestoring(false);
    }
  }, [id, fetchData, toast]);

  const doDelete = useCallback(async () => {
    if (!id) return;
    try {
      await projectsService.deletePermanently(id);
      toast?.showToast("Project permanently deleted", "success");
      navigate(ROUTES.PROJECTS_LIST);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete project";
      toast?.showToast(msg, "error");
    }
  }, [id, navigate, toast]);

  const [expanding, setExpanding] = useState(false);

  const doExpand = useCallback(async () => {
    if (!id) return;
    setExpanding(true);
    try {
      const result = await projectsService.expandStreets(id);
      toast?.showToast(result.message, result.addedSegments > 0 ? "success" : "info");
      if (result.addedSegments > 0) {
        await fetchData();
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to expand streets";
      toast?.showToast(msg, "error");
    } finally {
      setExpanding(false);
    }
  }, [id, fetchData, toast]);

  const handleArchiveClick = () => setArchiveConfirmOpen(true);
  const handleDeleteClick = () => setDeleteConfirmOpen(true);

  const boundaryBbox = useMemo(
    () => (mapData ? computeBoundaryBbox(mapData.boundary) : null),
    [mapData],
  );

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
      <div className="flex h-full flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-4 border-b border-border bg-surface px-4 py-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-48" />
        </header>
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="relative h-[45vh] w-full shrink-0 md:h-full md:flex-1">
            <UnifiedMap
              center={MAP_SHELL_CENTER}
              zoom={MAP_ZOOM.DEFAULT}
              streets={[]}
              gpsTraces={[]}
              className="h-full w-full"
            />
          </div>
          <ProjectSidePanel project={null} mapData={null} loading />
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <Card className="m-4 max-w-md">
        <p className="text-danger">{error}</p>
        <Button variant="secondary" onClick={() => void fetchData()} className="mt-2">
          Retry
        </Button>
        <Link to={ROUTES.PROJECTS_LIST} className="mt-3 block">
          Back to projects
        </Link>
      </Card>
    );
  }

  if (!project || !mapData) return null;

  const center = projectMapCenter(mapData);
  const highlightFocus = boundaryBbox !== null ? { bbox: boundaryBbox } : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to={ROUTES.PROJECTS_LIST} className="text-sm text-text-muted hover:underline">
            ← Projects
          </Link>
          <h1 className="text-xl font-bold text-text">{project.name}</h1>
          {project.isArchived && (
            <span className="rounded bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
              Archived
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {project.isArchived ? (
            <>
              <Button variant="secondary" onClick={doRestore} disabled={restoring}>
                {restoring ? "Restoring…" : "Restore project"}
              </Button>
              <Button variant="danger" onClick={handleDeleteClick}>
                Delete permanently
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={doExpand}
                disabled={expanding}
                title="Find additional street segments outside the boundary"
              >
                {expanding ? "Expanding…" : "Expand streets"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleArchiveClick}
                disabled={archiving}
              >
                {archiving ? "Archiving…" : "Archive"}
              </Button>
              <Button variant="danger" onClick={handleDeleteClick}>
                Delete
              </Button>
            </>
          )}
        </div>
      </header>

      <ConfirmModal
        isOpen={archiveConfirmOpen}
        onClose={() => setArchiveConfirmOpen(false)}
        title="Archive project?"
        message="It will be hidden from your list. You can view or restore it later from your projects list."
        confirmLabel="Archive"
        variant="danger"
        onConfirm={doArchive}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Permanently delete project?"
        message="This action cannot be undone. All project data, including progress and milestones, will be permanently deleted. Your activity data (runs) will NOT be affected."
        confirmLabel="Delete permanently"
        variant="danger"
        onConfirm={doDelete}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="h-[45vh] w-full shrink-0 md:h-full md:min-h-0 md:flex-1 md:shrink">
          <UnifiedMap
            center={center}
            zoom={MAP_ZOOM.PROJECT_DETAIL}
            streets={mapData.streets}
            gpsTraces={gpsTraces}
            boundary={mapData.boundary}
            showBoundaryOutline
            highlightFocus={highlightFocus}
            highlightOsmIds={EMPTY_HIGHLIGHT_OSM_IDS}
            showLegend
            className="h-full w-full"
          />
        </div>
        <ProjectSidePanel project={project} mapData={mapData} loading={loading} />
      </div>
    </div>
  );
}
