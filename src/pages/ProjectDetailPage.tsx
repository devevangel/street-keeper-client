/**
 * ProjectDetailPage
 * Map on the left, data side panel on the right.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button, Card, ConfirmModal, Input, ProgressBar, Skeleton } from "../components/common";
import { UnifiedMap, MapFilterCard, ALL_BINS, type MapViewHighlightFocus } from "../components/map";
import { useGpsTraces } from "../hooks";
import { MAP_ZOOM } from "../components/map/mapConstants";
import { projectsService } from "../services/projects.service";
import { getHomepageData, type HomepagePayload, type HomepageSuggestion } from "../services/homepage.service";
import { ApiError } from "../lib/api-client";
import { ROUTES } from "../config/constants";
import { useToast } from "../contexts/ToastContext";
import type { ProjectDetail, ProjectMapData, ProjectActivityItem } from "../types/api.types";
import { isUnnamedStreet, type FilterStatus } from "../utils/street-filters";
import { computeBoundaryBbox, projectMapCenter } from "../utils/map-utils";
import { isValidBbox } from "../utils/homepage-map-focus";
import { HomepageMetrics } from "../components/homepage/HomepageMetrics";
import { RecentRuns } from "../components/homepage/RecentRuns";
import { RunSuggestions, type ScrollItem } from "../components/homepage/RunSuggestions";
import { useFormatters } from "../contexts/PreferencesContext";

const MAP_SHELL_CENTER = { lat: 50.8, lng: -1.09 };
const EMPTY_HIGHLIGHT_OSM_IDS: string[] = [];
const MAX_SUGGESTIONS = 4;

function toDateInputValue(isoDate: string | null): string {
  return isoDate ? isoDate.slice(0, 10) : "";
}

function buildRunSuggestionItems(homepage: HomepagePayload): ScrollItem[] {
  const candidates = [
    homepage.primarySuggestion,
    ...homepage.alternates,
  ].filter((s): s is HomepageSuggestion => !!s?.clusterStats);
  return candidates.slice(0, MAX_SUGGESTIONS).map((s, i) => ({
    kind: "suggestion" as const,
    suggestion: s,
    isPrimary: i === 0,
  }));
}

interface ProjectSidePanelProps {
  project: ProjectDetail | null;
  mapData: ProjectMapData | null;
  loading: boolean;
  isEditingMetadata: boolean;
  metadataName: string;
  metadataDeadline: string;
  metadataSaving: boolean;
  metadataError: string | null;
  onMetadataNameChange: (value: string) => void;
  onMetadataDeadlineChange: (value: string) => void;
  onMetadataCancel: () => void;
  onMetadataSave: () => void;
  showTraces: boolean;
  onToggleTraces: () => void;
  visibleBins: Set<FilterStatus>;
  onToggleBin: (bin: FilterStatus) => void;
  onToggleAll: () => void;
  allBinsActive: boolean;
  homepage: HomepagePayload | null;
  activities: ProjectActivityItem[];
  onSelectRun: (activityId: string, bbox: [number, number, number, number]) => void;
  onViewSuggestionArea: (s: HomepageSuggestion) => void;
}

function formatActivityDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function ProjectSidePanel({
  project,
  mapData,
  loading,
  isEditingMetadata,
  metadataName,
  metadataDeadline,
  metadataSaving,
  metadataError,
  onMetadataNameChange,
  onMetadataDeadlineChange,
  onMetadataCancel,
  onMetadataSave,
  showTraces,
  onToggleTraces,
  visibleBins,
  onToggleBin,
  onToggleAll,
  allBinsActive,
  homepage,
  activities,
  onSelectRun,
  onViewSuggestionArea,
}: ProjectSidePanelProps) {
  const { formatDistance } = useFormatters();

  if (loading && !project) {
    return (
      <aside className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto border-border bg-bg md:w-[400px] md:flex-none md:border-l-2">
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
  const pct = stats.totalStreetNames > 0
    ? (stats.completedStreetNames / stats.totalStreetNames) * 100
    : stats.completionPercentage;
  const runSuggestionItems = homepage ? buildRunSuggestionItems(homepage) : [];

  // Deduplicate segments by logicalStreetKey (or name fallback) so the filter
  // card shows logical street counts, not raw segment counts.
  const streetsByName = useMemo(() => {
    const seen = new Map<string, (typeof mapData.streets)[number]>();
    for (const s of mapData.streets) {
      if (isUnnamedStreet(s.name)) continue;
      const key = s.logicalStreetKey ?? s.name.toLowerCase().trim();
      if (!seen.has(key)) seen.set(key, s);
    }
    return [...seen.values()];
  }, [mapData.streets]);

  return (
    <aside className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto border-border bg-bg md:w-[400px] md:flex-none md:border-l-2">
      <div className="flex flex-col gap-3 p-3 md:p-4">
        {isEditingMetadata && (
          <Card padding="none" className="w-full p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Edit details
            </h3>
            <form
              className="mt-2 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                onMetadataSave();
              }}
            >
              <Input
                label="Project name"
                value={metadataName}
                onChange={(event) => onMetadataNameChange(event.target.value)}
                maxLength={100}
                disabled={metadataSaving}
                required
              />
              <Input
                label="Deadline"
                type="date"
                value={metadataDeadline}
                onChange={(event) => onMetadataDeadlineChange(event.target.value)}
                disabled={metadataSaving}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onMetadataCancel}
                  disabled={metadataSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={metadataSaving}>
                  {metadataSaving ? "Saving…" : "Save"}
                </Button>
              </div>
            </form>
            {metadataError && (
              <p className="mt-2 text-sm text-danger">{metadataError}</p>
            )}
          </Card>
        )}

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
            <span>{stats.completedStreetNames} completed</span>
            <span>{stats.partialStreetNames} in progress</span>
            <span>{stats.notStartedStreetNames} not started</span>
          </div>
        </div>

        {/* Distance covered vs total */}
        {project.totalLengthMeters > 0 && (
          <Card padding="none" className="w-full p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Distance covered
              </span>
              <span className="text-xs text-text-muted">
                {((project.distanceCoveredMeters / project.totalLengthMeters) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-bold text-text">
                {formatDistance(project.distanceCoveredMeters)}
              </span>
              <span className="text-sm text-text-muted">
                / {formatDistance(project.totalLengthMeters)}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${Math.min((project.distanceCoveredMeters / project.totalLengthMeters) * 100, 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-text-muted">
              {formatDistance(project.totalLengthMeters - project.distanceCoveredMeters)} remaining
            </p>
          </Card>
        )}

        {/* Total Distance / Total Runs — use project street data as primary source */}
        <HomepageMetrics
          totalDistanceKm={
            project.distanceCoveredMeters > 0
              ? Math.round((project.distanceCoveredMeters / 1000) * 100) / 100
              : homepage?.totalDistanceKm ?? null
          }
          totalActivities={homepage?.totalActivities ?? null}
        />

        {/* Recent runs */}
        {homepage && (
          <RecentRuns
            lastRun={homepage.lastRun}
            runs={homepage.recentRuns}
            onSelect={onSelectRun}
          />
        )}

        {/* Map filters (bin toggles + traces) */}
        <MapFilterCard
          streets={streetsByName}
          visibleBins={visibleBins}
          onToggleBin={onToggleBin}
          onToggleAll={onToggleAll}
          allBinsActive={allBinsActive}
          showTraces={showTraces}
          onToggleTraces={onToggleTraces}
        />

        {/* Run suggestions */}
        {runSuggestionItems.length > 0 && (
          <RunSuggestions
            items={runSuggestionItems}
            onViewArea={onViewSuggestionArea}
          />
        )}

        {/* Activity history */}
        {activities.length > 0 && (
          <Card padding="none" className="w-full p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Recent activity
            </h3>
            <div className="mt-2 space-y-0 divide-y divide-border">
              {activities.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12l4-4 3 3 5-7" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{a.activityName}</p>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted">
                      <span>{formatActivityDate(a.date)}</span>
                      <span>{formatDistance(a.distanceMeters)}</span>
                      {a.durationSeconds > 0 && <span>{formatDuration(a.durationSeconds)}</span>}
                    </div>
                    {(a.streetsCompleted > 0 || a.streetsImproved > 0) && (
                      <div className="mt-1 flex gap-1.5">
                        {a.streetsCompleted > 0 && (
                          <span className="inline-block rounded bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success">
                            {a.streetsCompleted} completed
                          </span>
                        )}
                        {a.streetsImproved > 0 && (
                          <span className="inline-block rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            {a.streetsImproved} improved
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {activities.length > 5 && (
              <p className="mt-2 text-center text-xs text-text-muted">
                +{activities.length - 5} more activities
              </p>
            )}
          </Card>
        )}
      </div>
    </aside>
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
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metadataName, setMetadataName] = useState("");
  const [metadataDeadline, setMetadataDeadline] = useState("");
  const [metadataSaving, setMetadataSaving] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const toast = useToast();

  const { traces: gpsTraces } = useGpsTraces({ projectId: id ?? null });
  const [showTraces, setShowTraces] = useState(false);
  const [visibleBins, setVisibleBins] = useState<Set<FilterStatus>>(() => new Set(ALL_BINS));
  const allBinsActive = visibleBins.size === ALL_BINS.length;

  const [homepage, setHomepage] = useState<HomepagePayload | null>(null);
  const [activities, setActivities] = useState<ProjectActivityItem[]>([]);

  const [highlightTraceActivityId, setHighlightTraceActivityId] = useState<string | null>(null);
  const [runFocusActive, setRunFocusActive] = useState(false);
  const savedBinsRef = useRef<Set<FilterStatus> | null>(null);
  const savedTracesRef = useRef<boolean | null>(null);

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

      const center = projectRes.project;
      if (center) {
        getHomepageData({ projectId: id })
          .then((hp) => { if (!signal?.aborted) setHomepage(hp); })
          .catch(() => {});
        projectsService.getActivities(id)
          .then((res) => { if (!signal?.aborted) setActivities(res.activities ?? []); })
          .catch(() => {});
      }
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

  useEffect(() => {
    if (!project || isEditingMetadata) return;
    setMetadataName(project.name);
    setMetadataDeadline(toDateInputValue(project.deadline));
  }, [project, isEditingMetadata]);

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

  const handleArchiveClick = () => setArchiveConfirmOpen(true);
  const handleDeleteClick = () => setDeleteConfirmOpen(true);
  const handleEditMetadataClick = () => {
    if (!project) return;
    setMetadataName(project.name);
    setMetadataDeadline(toDateInputValue(project.deadline));
    setMetadataError(null);
    setIsEditingMetadata(true);
  };
  const handleCancelEditMetadata = () => {
    if (metadataSaving) return;
    setMetadataError(null);
    setIsEditingMetadata(false);
    if (project) {
      setMetadataName(project.name);
      setMetadataDeadline(toDateInputValue(project.deadline));
    }
  };

  const handleSaveMetadata = useCallback(async () => {
    if (!id) return;
    const trimmedName = metadataName.trim();
    if (!trimmedName) {
      setMetadataError("Project name is required.");
      return;
    }
    setMetadataSaving(true);
    setMetadataError(null);
    try {
      const result = await projectsService.updateMetadata(id, {
        name: trimmedName,
        deadline: metadataDeadline ? metadataDeadline : null,
      });
      setProject(result.project);
      setHomepage((prev) =>
        prev?.projectContext
          ? {
              ...prev,
              projectContext: {
                ...prev.projectContext,
                name: result.project.name,
              },
            }
          : prev
      );
      setIsEditingMetadata(false);
      toast?.showToast("Project details updated", "success");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to update project details";
      setMetadataError(msg);
      toast?.showToast(msg, "error");
    } finally {
      setMetadataSaving(false);
    }
  }, [id, metadataName, metadataDeadline, toast]);

  const [highlightOsmIds, setHighlightOsmIds] = useState<string[]>([]);
  const [streetHighlightFocus, setStreetHighlightFocus] =
    useState<MapViewHighlightFocus | null>(null);

  const boundaryBbox = useMemo(
    () => (mapData ? computeBoundaryBbox(mapData.boundary) : null),
    [mapData],
  );

  const handleSelectRun = useCallback(
    (activityId: string, bbox: [number, number, number, number]) => {
      setHighlightOsmIds([]);
      if (!runFocusActive) {
        savedBinsRef.current = new Set(visibleBins);
        savedTracesRef.current = showTraces;
      }
      setVisibleBins(new Set());
      setShowTraces(true);
      setRunFocusActive(true);
      setHighlightTraceActivityId(activityId);

      if (isValidBbox(bbox)) {
        const [minLat, minLng, maxLat, maxLng] = bbox;
        const latSpan = maxLat - minLat;
        const lngSpan = maxLng - minLng;
        const PAD = 0.001;
        const paddedBbox: [number, number, number, number] =
          latSpan < 0.002 || lngSpan < 0.002
            ? [minLat - PAD, minLng - PAD, maxLat + PAD, maxLng + PAD]
            : bbox;
        setStreetHighlightFocus({ bbox: paddedBbox });
      } else {
        setStreetHighlightFocus(null);
      }
    },
    [runFocusActive, visibleBins, showTraces],
  );

  const handleViewSuggestionArea = useCallback(
    (s: HomepageSuggestion) => {
      setHighlightTraceActivityId(null);
      if (runFocusActive && savedBinsRef.current) {
        setVisibleBins(savedBinsRef.current);
        savedBinsRef.current = null;
      }
      if (runFocusActive && savedTracesRef.current !== null) {
        setShowTraces(savedTracesRef.current);
        savedTracesRef.current = null;
      }
      setRunFocusActive(false);

      if (isValidBbox(s.focus.bbox)) {
        setStreetHighlightFocus({ bbox: s.focus.bbox });
      }
      if (s.focus.streetIds?.length) {
        setHighlightOsmIds(s.focus.streetIds.map(String));
      }
    },
    [runFocusActive],
  );

  const toggleBin = useCallback((bin: FilterStatus) => {
    setVisibleBins((prev) => {
      const next = new Set(prev);
      if (next.has(bin)) {
        next.delete(bin);
        if (next.size === 0) return new Set(ALL_BINS);
      } else {
        next.add(bin);
      }
      return next;
    });
  }, []);

  const toggleAllBins = useCallback(() => {
    setVisibleBins((prev) =>
      prev.size === ALL_BINS.length ? new Set<FilterStatus>() : new Set(ALL_BINS),
    );
  }, []);

  const resetHighlight = useCallback(() => {
    setHighlightOsmIds([]);
    setStreetHighlightFocus(null);
    setHighlightTraceActivityId(null);
    if (runFocusActive && savedBinsRef.current) {
      setVisibleBins(savedBinsRef.current);
      savedBinsRef.current = null;
    }
    if (runFocusActive && savedTracesRef.current !== null) {
      setShowTraces(savedTracesRef.current);
      savedTracesRef.current = null;
    }
    setRunFocusActive(false);
  }, [runFocusActive]);

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
          <ProjectSidePanel
            project={null}
            mapData={null}
            loading
            isEditingMetadata={false}
            metadataName=""
            metadataDeadline=""
            metadataSaving={false}
            metadataError={null}
            onMetadataNameChange={() => {}}
            onMetadataDeadlineChange={() => {}}
            onMetadataCancel={() => {}}
            onMetadataSave={() => {}}
            showTraces={false}
            onToggleTraces={() => {}}
            visibleBins={visibleBins}
            onToggleBin={toggleBin}
            onToggleAll={toggleAllBins}
            allBinsActive={allBinsActive}
            homepage={null}
            activities={[]}
            onSelectRun={() => {}}
            onViewSuggestionArea={() => {}}
          />
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
  const effectiveHighlightFocus =
    streetHighlightFocus ?? (boundaryBbox !== null ? { bbox: boundaryBbox } : null);
  const effectiveHighlightOsmIds =
    highlightOsmIds.length > 0 ? highlightOsmIds : EMPTY_HIGHLIGHT_OSM_IDS;
  const hasAnyHighlight =
    highlightOsmIds.length > 0 || highlightTraceActivityId != null;

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
              <Button variant="secondary" size="sm" onClick={handleEditMetadataClick}>
                Edit details
              </Button>
              <Button variant="secondary" onClick={doRestore} disabled={restoring}>
                {restoring ? "Restoring…" : "Restore project"}
              </Button>
              <Button variant="danger" onClick={handleDeleteClick}>
                Delete permanently
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={handleEditMetadataClick}>
                Edit details
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
        message="This action cannot be undone. All project data, including progress, will be permanently deleted. Your activity data (runs) will NOT be affected."
        confirmLabel="Delete permanently"
        variant="danger"
        onConfirm={doDelete}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative h-[45vh] w-full shrink-0 md:h-full md:min-h-0 md:flex-1 md:shrink">
          <UnifiedMap
            center={center}
            zoom={MAP_ZOOM.PROJECT_DETAIL}
            streets={mapData.streets}
            gpsTraces={showTraces ? gpsTraces : []}
            highlightTraceActivityId={highlightTraceActivityId}
            boundary={mapData.boundary}
            showBoundaryOutline
            highlightFocus={effectiveHighlightFocus}
            highlightOsmIds={effectiveHighlightOsmIds}
            visibleStreetBins={visibleBins}
            onVisibleStreetBinsChange={setVisibleBins}
            showLegend
            className="h-full w-full"
          />
          {hasAnyHighlight && (
            <button
              type="button"
              className="absolute left-3 top-3 z-[1000] flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-text shadow-lg transition-colors hover:bg-card-bg"
              onClick={resetHighlight}
            >
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8H4M4 8l3-3M4 8l3 3" />
              </svg>
              Back to overview
            </button>
          )}
        </div>
        <ProjectSidePanel
          project={project}
          mapData={mapData}
          loading={loading}
          isEditingMetadata={isEditingMetadata}
          metadataName={metadataName}
          metadataDeadline={metadataDeadline}
          metadataSaving={metadataSaving}
          metadataError={metadataError}
          onMetadataNameChange={setMetadataName}
          onMetadataDeadlineChange={setMetadataDeadline}
          onMetadataCancel={handleCancelEditMetadata}
          onMetadataSave={() => void handleSaveMetadata()}
          showTraces={showTraces}
          onToggleTraces={() => setShowTraces((v) => !v)}
          visibleBins={visibleBins}
          onToggleBin={toggleBin}
          onToggleAll={toggleAllBins}
          allBinsActive={allBinsActive}
          homepage={homepage}
          activities={activities}
          onSelectRun={handleSelectRun}
          onViewSuggestionArea={handleViewSuggestionArea}
        />
      </div>
    </div>
  );
}
