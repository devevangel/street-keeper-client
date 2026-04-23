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
import {
  getProjectSuggestions,
  invalidateProjectSuggestionsCache,
  type ProjectSuggestionsPayload,
  type HomepageSuggestion,
} from "../services/project-suggestions.service";
import { useSyncStatus } from "../hooks/useSyncStatus";
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

function buildRunSuggestionItems(
  payload: Pick<ProjectSuggestionsPayload, "primarySuggestion" | "alternates">,
): ScrollItem[] {
  const candidates = [
    payload.primarySuggestion,
    ...payload.alternates,
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
  suggestions: ProjectSuggestionsPayload | null;
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
  suggestions,
  activities,
  onSelectRun,
  onViewSuggestionArea,
}: ProjectSidePanelProps) {
  const { formatDistance } = useFormatters();

  if (loading && !project) {
    return (
      <aside className="flex flex-col border-border bg-bg md:min-h-0 md:w-[400px] md:flex-none md:overflow-y-auto md:border-l-2">
        <div className="flex w-full flex-col gap-3 p-3 md:p-4">
          {/* Overall progress (percentage + bar + stats) */}
          <div className="w-full space-y-2">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="flex gap-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          {/* Distance covered card */}
          <div className="w-full rounded-lg border border-border bg-surface p-4">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="mt-2 h-7 w-full" />
            <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
            <Skeleton className="mt-2 h-3 w-36" />
          </div>

          {/* Metrics row (TOTAL DISTANCE / TOTAL RUNS) */}
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-surface p-4">
              <Skeleton className="mb-2 h-3 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <Skeleton className="mb-2 h-3 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>

          {/* YOUR RUNS — last run + recent runs */}
          <div className="w-full rounded-lg border border-border bg-surface p-4">
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="mb-2 h-12 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>

          {/* STREETS ON MAP — 2×2 filter bins + traces toggle */}
          <div className="w-full rounded-lg border border-border bg-surface p-4">
            <Skeleton className="mb-1 h-3 w-28" />
            <Skeleton className="mb-3 h-3 w-48" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-10 w-full rounded-lg" />
          </div>

          {/* NEXT RUN SUGGESTIONS */}
          <div className="w-full rounded-lg border border-border bg-surface p-4">
            <Skeleton className="mb-3 h-3 w-32" />
            <Skeleton className="mb-3 h-5 w-full" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-10 w-full rounded-lg" />
          </div>
        </div>
      </aside>
    );
  }

  if (!project || !mapData) return null;

  const stats = mapData.stats;
  const pct = stats.totalStreetNames > 0
    ? (stats.completedStreetNames / stats.totalStreetNames) * 100
    : stats.completionPercentage;
  const runSuggestionItems = suggestions ? buildRunSuggestionItems(suggestions) : [];

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
    <aside className="flex flex-col border-border bg-bg md:min-h-0 md:w-[400px] md:flex-none md:overflow-y-auto md:border-l-2">
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

        {/* Total Distance / Total Runs — prefer project-scoped stats from /next-runs */}
        <HomepageMetrics
          totalDistanceKm={
            project.distanceCoveredMeters > 0
              ? Math.round((project.distanceCoveredMeters / 1000) * 100) / 100
              : suggestions?.totalDistanceKm ?? null
          }
          totalActivities={suggestions?.totalActivities ?? null}
        />

        {/* Recent runs */}
        {suggestions && (
          <RecentRuns
            lastRun={suggestions.lastRun}
            runs={suggestions.recentRuns}
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

        {/* Next run / lifecycle state. The backend tells us explicitly whether
            the project is "preparing" (streets not materialized yet),
            "completed" (progress >= 100), or "in_progress" (normal case).
            This replaces the previous silent-empty behavior when no clusters
            could be generated. */}
        {suggestions?.projectState === "completed" ? (
          <Card padding="none" className="w-full p-3">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                <svg
                  viewBox="0 0 16 16"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 8l4 4 8-10" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold leading-snug text-text">
                  Project complete
                </h3>
                <p className="mt-0.5 text-xs leading-snug text-text-muted">
                  {suggestions.completionSummary?.completedAt
                    ? `Finished ${formatActivityDate(suggestions.completionSummary.completedAt)}.`
                    : "You've covered every street in this project."}
                </p>
                {suggestions.completionSummary && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-bg px-2.5 py-2">
                      <p className="text-lg font-bold leading-tight text-success">
                        {suggestions.completionSummary.totalStreets}
                      </p>
                      <p className="text-[11px] leading-tight text-text-muted">
                        streets covered
                      </p>
                    </div>
                    <div className="rounded-lg bg-bg px-2.5 py-2">
                      <p className="text-lg font-bold leading-tight text-text">
                        {suggestions.completionSummary.totalDistanceKm.toFixed(1)} km
                      </p>
                      <p className="text-[11px] leading-tight text-text-muted">
                        total distance
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ) : suggestions?.projectState === "preparing" ? (
          <Card padding="none" className="w-full p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Next run
            </h3>
            <p className="mt-2 text-sm text-text-muted">
              Still preparing your project streets. Suggestions will appear here shortly.
            </p>
          </Card>
        ) : runSuggestionItems.length > 0 ? (
          <RunSuggestions
            items={runSuggestionItems}
            onViewArea={onViewSuggestionArea}
          />
        ) : null}

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

  const [suggestions, setSuggestions] = useState<ProjectSuggestionsPayload | null>(null);
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
        getProjectSuggestions(id)
          .then((payload) => { if (!signal?.aborted) setSuggestions(payload); })
          .catch((err) => {
            console.error("[ProjectDetail] Failed to load next-run suggestions:", err);
          });
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

  // When a background sync finishes, anything the user just ran may have
  // flipped street progress / added activities / completed the project.
  // Invalidate the per-project suggestions cache and quietly refresh the
  // pieces of data that change on new activities, without toggling the
  // full-page loading skeleton.
  const syncStatus = useSyncStatus();
  useEffect(() => {
    if (!syncStatus.didComplete || !id) return;
    invalidateProjectSuggestionsCache(id);
    let aborted = false;
    (async () => {
      try {
        const [projectRes, mapRes] = await Promise.all([
          projectsService.getById(id, { includeStreets: true }),
          projectsService.getMap(id),
        ]);
        if (aborted) return;
        setProject(projectRes.project);
        setMapData(mapRes.map);
      } catch (err) {
        if (!aborted) {
          console.error("[ProjectDetail] Post-sync project refresh failed:", err);
        }
      }
      try {
        const payload = await getProjectSuggestions(id);
        if (!aborted) setSuggestions(payload);
      } catch (err) {
        if (!aborted) {
          console.error("[ProjectDetail] Post-sync suggestion refresh failed:", err);
        }
      }
      try {
        const res = await projectsService.getActivities(id);
        if (!aborted) setActivities(res.activities ?? []);
      } catch {
        // non-fatal
      }
    })();
    return () => {
      aborted = true;
    };
  }, [syncStatus.didComplete, id]);

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
      // Keep the suggestions payload's cached project name in sync so the
      // panel doesn't flash a stale name until the next /next-runs refetch.
      setSuggestions((prev) =>
        prev
          ? {
              ...prev,
              projectContext: {
                ...prev.projectContext,
                name: result.project.name,
              },
            }
          : prev,
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
      <div className="flex min-h-full flex-col md:h-full md:overflow-hidden">
        <header className="flex shrink-0 items-center gap-4 border-b border-border bg-surface px-4 py-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-48" />
        </header>
        <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
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
            suggestions={null}
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
    <div className="flex min-h-full flex-col md:h-full md:overflow-hidden">
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

      <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
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
          suggestions={suggestions}
          activities={activities}
          onSelectRun={handleSelectRun}
          onViewSuggestionArea={handleViewSuggestionArea}
        />
      </div>
    </div>
  );
}
