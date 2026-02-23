/**
 * Returning User Homepage
 * Two-column layout: map on left, projects sidebar on right.
 * Shows top project (most ran streets) and up to 3 ongoing projects.
 * Each project card has its own collapsible streets list.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { MetricBlock } from "../common/MetricBlock";
import { SuggestionCard } from "./SuggestionCard";
import { ProjectCardWithStreets } from "./ProjectCardWithStreets";
import { UniversalSearchInput } from "../projects/UniversalSearchInput";
import { UnifiedMap, MAP_ZOOM, type MapViewHighlightFocus } from "../map";
import { useAnalytics } from "../../contexts/AnalyticsContext";
import { usePreferences } from "../../contexts/PreferencesContext";
import { activitiesService } from "../../services/activities.service";
import { projectsService } from "../../services/projects.service";
import { invalidateHomepageCache } from "../../services/homepage.service";
import { ROUTES } from "../../config/constants";
import { FILTER_PILLS, getStreetBin, type FilterStatus } from "../../utils/street-filters";
import type { HomepagePayload } from "../../services/homepage.service";
import type {
  MapStreet,
  ProjectMapData,
  ProjectMapStreet,
} from "../../types/api.types";
import type { ProjectListItem } from "../../types/api.types";
import type { GeocodingResult } from "../../types/api.types";

interface ReturningUserHomepageProps {
  data: HomepagePayload;
  isLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  /** Map center when user has focused on a location (e.g. project). null = use userLocation. */
  mapCenter: { lat: number; lng: number } | null;
  streets: MapStreet[];
  onViewportChange: (center: { lat: number; lng: number }) => void;
  onRefetch: () => Promise<void>;
  /** Clear accumulated map segments (call on sync to avoid stale data). */
  onClearSegments: () => void;
  /** Refetch map streets (call on sync to load fresh data). */
  onRefetchMapStreets: () => void;
  onSearchSelect: (result: GeocodingResult) => void;
  /** Focus map on a location (e.g. when user clicks a street in a project). Stops following user. */
  onFocusLocation?: (center: { lat: number; lng: number }) => void;
}

function osmIdToWayId(osmId: string): number {
  return parseInt(osmId.replace("way/", ""), 10);
}

/** Compute bounding box from street geometries. Returns [minLat, minLng, maxLat, maxLng]. */
function computeBboxFromStreets(
  streets: ProjectMapStreet[]
): [number, number, number, number] {
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;
  for (const s of streets) {
    const coords = s.geometry?.coordinates ?? [];
    for (const [lng, lat] of coords) {
      if (lat < minLat) minLat = lat;
      if (lng < minLng) minLng = lng;
      if (lat > maxLat) maxLat = lat;
      if (lng > maxLng) maxLng = lng;
    }
  }
  if (minLat === Infinity) return [50, -1, 50, -1];
  return [minLat, minLng, maxLat, maxLng];
}

/** Convert ProjectMapStreet to MapStreet for rendering (project map has geometry for all streets including not_started). */
function projectStreetToMapStreet(p: ProjectMapStreet): MapStreet {
  const status = p.status === "not_started" ? "partial" : p.status;
  return {
    osmId: p.osmId,
    name: p.name,
    highwayType: p.highwayType,
    lengthMeters: p.lengthMeters,
    percentage: p.percentage,
    status,
    geometry: p.geometry,
    stats: {
      runCount: 0,
      completionCount: 0,
      firstRunDate: null,
      lastRunDate: null,
      totalLengthMeters: p.lengthMeters,
      currentPercentage: p.percentage,
      everCompleted: p.status === "completed",
      weightedCompletionRatio: p.percentage / 100,
      segmentCount: 1,
      connectorCount: 0,
    },
  };
}

export function ReturningUserHomepage({
  data,
  isLoading,
  userLocation,
  mapCenter,
  streets,
  onViewportChange,
  onRefetch,
  onClearSegments,
  onRefetchMapStreets,
  onSearchSelect,
  onFocusLocation,
}: ReturningUserHomepageProps) {
  const { track } = useAnalytics();
  const preferences = usePreferences();
  const [highlightFocus, setHighlightFocus] =
    useState<MapViewHighlightFocus | null>(null);
  const [highlightProjectId, setHighlightProjectId] = useState<string | null>(
    null,
  );
  const [highlightStreetsFromProject, setHighlightStreetsFromProject] =
    useState<MapStreet[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    synced: number;
    error?: string;
  } | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [binCounts, setBinCounts] = useState({ completed: 0, almostThere: 0, inProgress: 0, notStarted: 0 });
  const binCountsByProjectRef = useRef<Record<string, { completed: number; almostThere: number; inProgress: number; notStarted: number }>>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const projectMapCache = useRef(new Map<string, ProjectMapData>());

  // Sync activeFilter with user preference once loaded
  const prefStreetFilter = preferences?.preferences?.defaultStreetFilter;
  useEffect(() => {
    if (prefStreetFilter && prefStreetFilter !== "all") {
      setActiveFilter(prefStreetFilter as FilterStatus);
    }
  }, [prefStreetFilter]);

  // Effective map center: use focused location when set, otherwise user location
  const effectiveMapCenter = mapCenter ?? userLocation;

  // Fetch projects on mount
  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);
    projectsService
      .getAll()
      .then((res) => {
        if (cancelled) return;
        const activeProjects = res.projects.filter((p) => !p.isArchived);
        activeProjects.sort((a, b) => {
          const aCompleted = a.completedStreetNames ?? a.completedStreets;
          const bCompleted = b.completedStreetNames ?? b.completedStreets;
          return bCompleted - aCompleted;
        });
        setProjects(activeProjects.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStreetBlur = useCallback(() => {
    setHighlightProjectId(null);
    setHighlightStreetsFromProject([]);
    setHighlightFocus(null);
  }, []);

  const handleStreetClick = useCallback(
    async ({
      project,
      osmIds,
    }: {
      project: ProjectListItem;
      streetName: string;
      osmIds: string[];
    }) => {
      onFocusLocation?.({ lat: project.centerLat, lng: project.centerLng });
      mapRef.current?.scrollIntoView({ behavior: "smooth" });

      const wayIds = osmIds.map(osmIdToWayId).filter((id) => !Number.isNaN(id));
      if (wayIds.length === 0) return;

      let mapData = projectMapCache.current.get(project.id);
      if (!mapData) {
        try {
          const res = await projectsService.getMap(project.id);
          mapData = res.map;
          projectMapCache.current.set(project.id, mapData);
        } catch {
          return;
        }
      }

      const osmIdSet = new Set(osmIds);
      const matchingStreets = mapData.streets.filter((s) => osmIdSet.has(s.osmId));

      const bbox =
        matchingStreets.length > 0
          ? computeBboxFromStreets(matchingStreets)
          : ([
              project.centerLat - project.radiusMeters / 111000,
              project.centerLng -
                project.radiusMeters /
                  111000 /
                  (Math.cos((project.centerLat * Math.PI) / 180) || 1),
              project.centerLat + project.radiusMeters / 111000,
              project.centerLng +
                project.radiusMeters /
                  111000 /
                  (Math.cos((project.centerLat * Math.PI) / 180) || 1),
            ] as [number, number, number, number]);

      setHighlightProjectId(project.id);
      setHighlightStreetsFromProject(
        matchingStreets.map((p) => projectStreetToMapStreet(p)),
      );
      setHighlightFocus({
        bbox,
        streetIds: wayIds,
        startPoint: { lat: project.centerLat, lng: project.centerLng },
      });
    },
    [onFocusLocation],
  );

  const handleShowOnMap = useCallback(() => {
    if (data.primarySuggestion?.focus) {
      setHighlightProjectId(null);
      setHighlightStreetsFromProject([]);
      setHighlightFocus({
        bbox: data.primarySuggestion.focus.bbox,
        streetIds: data.primarySuggestion.focus.streetIds,
        startPoint: data.primarySuggestion.focus.startPoint,
      });
      mapRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [data.primarySuggestion?.focus]);

  // Clear project highlight when highlightFocus is cleared (e.g. user pans map)
  useEffect(() => {
    if (!highlightFocus) {
      setHighlightProjectId(null);
      setHighlightStreetsFromProject([]);
    }
  }, [highlightFocus]);

  // Merge streets: add project map streets for highlighted ones not in main map data
  const mergedStreets = useMemo(() => {
    const existingIds = new Set(streets.map((s) => s.osmId));
    const toAdd = highlightStreetsFromProject.filter(
      (s) => !existingIds.has(s.osmId),
    );
    return [...streets, ...toAdd];
  }, [streets, highlightStreetsFromProject]);

  // Filter map streets by active pill selection (mirror pill behavior on map)
  const highlightOsmIdSet = useMemo(
    () => new Set(highlightFocus?.streetIds?.map((id) => `way/${id}`) ?? []),
    [highlightFocus?.streetIds],
  );
  const filteredStreetsForMap = useMemo(() => {
    if (!mergedStreets.length) return mergedStreets;
    return mergedStreets.filter((s) => {
      const completed = s.status === "completed";
      const bin = getStreetBin(s.percentage ?? 0, completed);
      const matchesFilter = activeFilter === "all" || bin === activeFilter;
      const isHighlighted = highlightOsmIdSet.has(s.osmId);
      return matchesFilter || isHighlighted;
    });
  }, [mergedStreets, activeFilter, highlightOsmIdSet]);

  const handleSync = useCallback(async () => {
    track("sync_clicked", {});
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await activitiesService.syncFromStrava();
      setSyncResult({ synced: result.synced + result.processed });
      invalidateHomepageCache();
      onClearSegments();
      onRefetchMapStreets();
      await onRefetch();
    } catch (err) {
      setSyncResult({
        synced: 0,
        error: err instanceof Error ? err.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
    }
  }, [track, onRefetch, onClearSegments, onRefetchMapStreets]);

  const featuredProjects = projects.slice(0, 3);

  const heroMetricTotals = useMemo(() => {
    let completed = 0;
    let total = 0;
    for (const p of featuredProjects) {
      completed += p.completedStreetNames ?? p.completedStreets ?? 0;
      total += p.totalStreetNames ?? p.totalStreets ?? 0;
    }
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }, [featuredProjects]);

  const handleBinCountsReport = useCallback((projectId: string, counts: { completed: number; almostThere: number; inProgress: number; notStarted: number }) => {
    binCountsByProjectRef.current[projectId] = counts;
    const totals = Object.values(binCountsByProjectRef.current).reduce(
      (acc, c) => ({
        completed: acc.completed + c.completed,
        almostThere: acc.almostThere + c.almostThere,
        inProgress: acc.inProgress + c.inProgress,
        notStarted: acc.notStarted + c.notStarted,
      }),
      { completed: 0, almostThere: 0, inProgress: 0, notStarted: 0 }
    );
    setBinCounts(totals);
  }, []);

  return (
    <>
      {/* Mobile: Suggestion on top */}
      <div className="block space-y-4 md:hidden">
        {data.primarySuggestion && (
          <SuggestionCard
            suggestion={data.primarySuggestion}
            isLoading={isLoading}
            onShowOnMap={handleShowOnMap}
            onTrack={(action: "show_on_map" | "view_milestones") => {
              track("primary_action_clicked", { action });
              if (action === "show_on_map" && data.primarySuggestion) {
                track("suggestion_opened", {
                  type: data.primarySuggestion.type,
                  cooldownKey: data.primarySuggestion.cooldownKey,
                  context: data.mapContext?.projectId ? "project" : "area",
                  projectId: data.mapContext?.projectId ?? undefined,
                });
              }
            }}
          />
        )}
      </div>

      {/* Two-column layout: map left, sidebar right */}
      <div className="-mx-4 w-[calc(100%+2rem)] flex min-h-0 flex-1 flex-col md:mx-0 md:w-full md:flex-row">
        {/* Map section - left side */}
        <div className="order-1 min-h-[40vh] w-full flex-1 md:order-1 md:h-auto md:min-h-[calc(100vh-120px)]">
          <div ref={mapRef} className="h-[40vh] w-full md:h-full">
            <UnifiedMap
              center={effectiveMapCenter}
              zoom={userLocation ? MAP_ZOOM.USER_LOCATION : (preferences?.preferences?.defaultMapZoom ?? MAP_ZOOM.DEFAULT)}
              userLocation={userLocation}
              showUserLocationMarker
              streets={filteredStreetsForMap}
              onViewportChange={onViewportChange}
              highlightFocus={highlightFocus}
              highlightOsmIds={
                highlightFocus?.streetIds?.map((id) => `way/${id}`) ?? []
              }
              showLegend={false}
              showLegendGuide
              className="h-full w-full"
              isLoading={!userLocation && !mapCenter}
              loadingMessage="Getting your location…"
            />
          </div>
        </div>

        {/* Sidebar - right side */}
        <aside className="order-2 w-full shrink-0 border-border bg-surface md:order-2 md:h-auto md:min-h-[calc(100vh-120px)] md:w-[380px] md:overflow-y-auto md:border-l-2">
          <div className="flex flex-col gap-4 p-4 md:p-6">
            {/* Search bar */}
            <div>
              <UniversalSearchInput
                placeholder="Search area…"
                onSelect={onSearchSelect}
              />
            </div>

            {/* Hero metric: total progress across featured projects */}
            {featuredProjects.length > 0 && heroMetricTotals.total > 0 && (
              <Card padding="md" className="space-y-1">
                <MetricBlock label="Your progress" value={heroMetricTotals.completed} size="md" />
                <span className="text-sm text-text-muted">
                  of {heroMetricTotals.total} streets · {heroMetricTotals.percentage}%
                </span>
              </Card>
            )}

            {/* Sync button – single secondary action per guide; verb phrase label */}
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                onClick={handleSync}
                disabled={syncing}
                className="w-full"
              >
                {syncing ? "Syncing activities…" : "Sync activities from Strava"}
              </Button>
              {syncResult && (
                <span
                  className={`text-sm ${syncResult.error ? "text-danger" : "text-success"}`}
                >
                  {syncResult.error ??
                    (syncResult.synced > 0
                      ? `Synced ${syncResult.synced} activit${syncResult.synced !== 1 ? "ies" : "y"}`
                      : "No new activities")}
                </span>
              )}
            </div>

            {/* Desktop: Suggestion */}
            <div className="hidden space-y-4 md:block">
              {data.primarySuggestion && (
                <SuggestionCard
                  suggestion={data.primarySuggestion}
                  isLoading={isLoading}
                  onShowOnMap={handleShowOnMap}
                  onTrack={(action: "show_on_map" | "view_milestones") => {
                    track("primary_action_clicked", { action });
                    if (action === "show_on_map" && data.primarySuggestion) {
                      track("suggestion_opened", {
                        type: data.primarySuggestion.type,
                        cooldownKey: data.primarySuggestion.cooldownKey,
                        context: data.mapContext?.projectId ? "project" : "area",
                        projectId: data.mapContext?.projectId ?? undefined,
                      });
                    }
                  }}
                />
              )}
            </div>

            {/* Global filter pills - only show once streets are loaded or show just the active filter */}
            {featuredProjects.length > 0 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter streets">
                {/* Only show "All" if it's active OR if we have any bin counts (streets loaded) */}
                {(activeFilter === "all" || Object.values(binCounts).some(c => c > 0)) && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    className={`min-h-[44px] flex-[0.95] rounded-full border px-3 py-2 text-sm font-medium transition-all ${
                      activeFilter === "all"
                        ? "border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30"
                        : "border-border bg-surface text-text-muted hover:bg-border/50 hover:border-text-muted"
                    }`}
                  >
                    All
                  </button>
                )}
                {FILTER_PILLS.map(({ key, label, dotColor }) => {
                  const count = binCounts[key as keyof typeof binCounts];
                  const isActive = activeFilter === key;
                  // Always show the active filter pill, hide others with count === 0
                  if (count === 0 && !isActive) return null;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveFilter(key)}
                      className={`min-h-[44px] flex-[0.95] inline-flex items-center justify-center gap-1 rounded-full border px-3 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? "border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30"
                          : "border-border bg-surface text-text-muted hover:bg-border/50 hover:border-text-muted"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} aria-hidden />
                      {count > 0 ? count : label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Featured Projects */}
            {projectsLoading ? (
              <Card padding="sm">
                <p className="text-text-muted text-sm">Loading projects…</p>
              </Card>
            ) : featuredProjects.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-text">Featured Projects</h3>
                {featuredProjects.map((project) => (
                  <ProjectCardWithStreets
                    key={project.id}
                    project={project}
                    activeFilter={activeFilter}
                    onStreetClick={handleStreetClick}
                    onStreetBlur={handleStreetBlur}
                    onBinCountsReport={handleBinCountsReport}
                  />
                ))}
                <Link
                  to={ROUTES.PROJECTS_LIST}
                  className="block text-center text-sm text-primary hover:underline"
                >
                  View more projects →
                </Link>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}
