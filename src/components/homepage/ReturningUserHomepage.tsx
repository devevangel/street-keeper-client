/**
 * Returning User Homepage
 * Two-column layout: map on left, projects sidebar on right.
 * Shows top project (most ran streets) and up to 3 ongoing projects.
 * Each project card has its own collapsible streets list.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, ProgressLoader, ProgressRing } from "../common";
import { NextRunCard } from "./NextRunCard";
import { LastRunCard } from "./LastRunCard";
import { HighlightsCard } from "./HighlightsCard";
import { ProjectCardWithStreets } from "./ProjectCardWithStreets";
import { UniversalSearchInput } from "../projects/UniversalSearchInput";
import { UnifiedMap, MAP_ZOOM, MapLegendFilterBins, type MapViewHighlightFocus } from "../map";
import { getStreetBin, type FilterStatus } from "../../utils/street-filters";
import { computeBboxFromStreets } from "../../utils/map-utils";
import { normalizeStreetName } from "../../utils/normalize-street-name";
import { useAnalytics } from "../../contexts/AnalyticsContext";
import { usePreferences } from "../../contexts/PreferencesContext";
import { useToast } from "../../contexts/ToastContext";
import { activitiesService } from "../../services/activities.service";
import { projectsService } from "../../services/projects.service";
import { invalidateHomepageCache } from "../../services/homepage.service";
import { ROUTES } from "../../config/constants";
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
  const [visibleBins, setVisibleBins] = useState<Set<FilterStatus>>(
    () => new Set(["completed", "almostThere", "inProgress", "notStarted"])
  );
  const mapRef = useRef<HTMLDivElement>(null);
  const projectMapCache = useRef(new Map<string, ProjectMapData>());
  const toast = useToast();
  // Track if projects have been fetched to prevent duplicate requests (e.g., in React StrictMode)
  const projectsFetchedRef = useRef(false);

  // Sync visibleBins with user preference once loaded
  const prefStreetFilter = preferences?.preferences?.defaultStreetFilter;
  useEffect(() => {
    if (prefStreetFilter && prefStreetFilter !== "all") {
      // If user has a preference, show only that bin
      setVisibleBins(new Set([prefStreetFilter as FilterStatus]));
    }
  }, [prefStreetFilter]);

  // Effective map center: use focused location when set, otherwise user location
  // Memoize to prevent unnecessary re-renders of UnifiedMap
  const effectiveMapCenter = useMemo(
    () => mapCenter ?? userLocation,
    [mapCenter?.lat, mapCenter?.lng, userLocation?.lat, userLocation?.lng]
  );

  // Memoize zoom to prevent re-renders when preferences object reference changes
  const mapZoom = useMemo(
    () => userLocation ? MAP_ZOOM.USER_LOCATION : (preferences?.preferences?.defaultMapZoom ?? MAP_ZOOM.DEFAULT),
    [userLocation, preferences?.preferences?.defaultMapZoom]
  );

  // Fetch projects on mount (only once, even in React StrictMode)
  useEffect(() => {
    if (projectsFetchedRef.current) {
      console.log(`[ReturningUserHomepage] Projects fetch skipped - already fetched`);
      return;
    }
    console.log(`[ReturningUserHomepage] Fetching projects at ${new Date().toISOString()}`);
    projectsFetchedRef.current = true;
    
    let cancelled = false;
    setProjectsLoading(true);
    projectsService
      .getAll()
      .then((res) => {
        if (cancelled) {
          console.log(`[ReturningUserHomepage] Projects request cancelled`);
          return;
        }
        console.log(`[ReturningUserHomepage] Projects received: ${res.projects.length} total`);
        const activeProjects = res.projects.filter((p) => !p.isArchived);
        activeProjects.sort((a, b) => {
          const aCompleted = a.completedStreetNames ?? a.completedStreets;
          const bCompleted = b.completedStreetNames ?? b.completedStreets;
          return bCompleted - aCompleted;
        });
        console.log(`[ReturningUserHomepage] Setting ${activeProjects.slice(0, 3).length} active projects`);
        setProjects(activeProjects.slice(0, 3));
      })
      .catch((err) => {
        console.error(`[ReturningUserHomepage] Error fetching projects:`, err);
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) {
          console.log(`[ReturningUserHomepage] Projects loading complete`);
          setProjectsLoading(false);
        }
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
      streetName,
    }: {
      project: ProjectListItem;
      streetName: string;
      osmIds: string[];
    }) => {
      const lat = project.centerLat ?? 0;
      const lng = project.centerLng ?? 0;
      onFocusLocation?.({ lat, lng });
      mapRef.current?.scrollIntoView({ behavior: "smooth" });

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

      // Match by normalized name - same logic as completion coloring uses
      // This ensures ALL segments of the street are highlighted, not just pre-grouped ones
      const targetName = normalizeStreetName(streetName);
      const matchingStreets = mapData.streets.filter(
        (s) => normalizeStreetName(s.name || "Unnamed") === targetName
      );

      if (matchingStreets.length === 0) return;

      const wayIds = matchingStreets
        .map((s) => osmIdToWayId(s.osmId))
        .filter((id) => !Number.isNaN(id));

      const bbox = computeBboxFromStreets(matchingStreets);

      setHighlightProjectId(project.id);
      setHighlightStreetsFromProject(
        matchingStreets.map((p) => projectStreetToMapStreet(p)),
      );
      setHighlightFocus({
        bbox,
        streetIds: wayIds,
        startPoint: { lat, lng },
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

  // Calculate bin counts directly from map streets
  const binCounts = useMemo(() => {
    const counts = { completed: 0, almostThere: 0, inProgress: 0, notStarted: 0 };
    for (const s of mergedStreets) {
      const completed = s.status === "completed";
      const bin = getStreetBin(s.percentage ?? 0, completed);
      if (bin !== "all") counts[bin]++;
    }
    return counts;
  }, [mergedStreets]);

  // Filter map streets by visible bins (controlled by legend)
  const highlightOsmIdSet = useMemo(
    () => new Set(highlightFocus?.streetIds?.map((id) => `way/${id}`) ?? []),
    [highlightFocus?.streetIds],
  );
  const filteredStreetsForMap = useMemo(() => {
    if (!mergedStreets.length) return mergedStreets;
    return mergedStreets.filter((s) => {
      const completed = s.status === "completed";
      const bin = getStreetBin(s.percentage ?? 0, completed);
      const matchesFilter = visibleBins.has(bin);
      const isHighlighted = highlightOsmIdSet.has(s.osmId);
      return matchesFilter || isHighlighted;
    });
  }, [mergedStreets, visibleBins, highlightOsmIdSet]);

  const handleSync = useCallback(async () => {
    track("sync_clicked", {});
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await activitiesService.syncFromStrava();
      const synced = result.synced + result.processed;
      setSyncResult({ synced });
      invalidateHomepageCache();
      onClearSegments();
      onRefetchMapStreets();
      await onRefetch();
      toast?.showToast(
        synced > 0 ? `Synced ${synced} activity${synced === 1 ? "" : "ies"}.` : "Activities synced.",
        "success",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      setSyncResult({ synced: 0, error: msg });
      toast?.showToast(msg, "error");
    } finally {
      setSyncing(false);
    }
  }, [track, onRefetch, onClearSegments, onRefetchMapStreets, toast]);

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

  return (
    <div className="flex h-full flex-col overflow-hidden md:flex-row">
      {/* Map section - left side */}
      <div className="h-[45vh] w-full shrink-0 md:h-full md:min-h-0 md:flex-1 md:shrink">
        <div ref={mapRef} className="relative h-full w-full">
          <UnifiedMap
            center={effectiveMapCenter ?? { lat: 50.8, lng: -1.09 }}
            zoom={mapZoom}
            userLocation={userLocation}
            showUserLocationMarker
            streets={filteredStreetsForMap}
            onViewportChange={onViewportChange}
            highlightFocus={highlightFocus}
            highlightOsmIds={
              highlightFocus?.streetIds?.map((id) => `way/${id}`) ?? []
            }
            showLegend={false}
            showLegendGuide={false}
            className="h-full w-full"
            isLoading={!userLocation && !mapCenter}
            loadingMessage="Getting your location…"
          />
          {/* Sync progress overlay */}
          {syncing && (
            <ProgressLoader type="sync" overlay title="Syncing with Strava" />
          )}
          {/* Interactive bin-based legend */}
          {mergedStreets.length > 0 && !syncing && (
            <MapLegendFilterBins
              visibleBins={visibleBins}
              onToggle={(bin) => {
                setVisibleBins((prev) => {
                  const next = new Set(prev);
                  if (next.has(bin)) next.delete(bin);
                  else next.add(bin);
                  return next;
                });
              }}
              counts={binCounts}
              onShowAll={() => {
                setVisibleBins(new Set(["completed", "almostThere", "inProgress", "notStarted"]));
              }}
            />
          )}
        </div>
      </div>

      {/* Sidebar - right side */}
      <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto border-border bg-surface md:w-[380px] md:flex-none md:border-l">
        {/* Fixed header: welcome + search */}
        <div className="space-y-3 border-b border-border p-4">
          <div>
            <h2 className="text-lg font-bold text-text">
              Welcome back{data.userName ? `, ${data.userName}` : ""}!
            </h2>
            {data.streak.currentWeeks > 0 && (
              <span className="text-sm text-success font-medium">
                {data.streak.currentWeeks}-week streak
              </span>
            )}
          </div>
          <UniversalSearchInput
            placeholder="Search area…"
            onSelect={onSearchSelect}
          />
        </div>

        {/* Scrollable content section */}
        <div className="space-y-4 p-4 pb-8 md:flex-1 md:overflow-y-auto md:pb-4">
          {/* Your next run */}
          <NextRunCard data={data} onShowOnMap={handleShowOnMap} />

          {/* Your progress (ring) */}
          {heroMetricTotals.total > 0 && (
            <Card padding="md">
              <h3 className="text-sm font-semibold text-text-muted mb-2">Your progress</h3>
              <ProgressRing value={heroMetricTotals.percentage} animated size={72} strokeWidth={8}>
                <div>
                  <p className="text-base font-bold text-text">
                    {heroMetricTotals.completed} streets conquered!
                  </p>
                  <p className="text-sm text-text-muted">
                    {heroMetricTotals.percentage}% of this area explored
                  </p>
                  {data.nextMilestone && !data.nextMilestone.progress.isCompleted && (
                    <p className="text-xs text-text-muted mt-1">
                      Next: {data.nextMilestone.name} ({data.nextMilestone.progress.targetValue - data.nextMilestone.progress.currentValue} to go)
                    </p>
                  )}
                </div>
              </ProgressRing>
            </Card>
          )}

          {/* Last run */}
          <LastRunCard data={data} />

          {/* Highlights */}
          <HighlightsCard data={data} />

          {/* Focus project (first featured) */}
          {projectsLoading ? (
            <Card padding="sm">
              <ProgressLoader type="projects" size="sm" />
            </Card>
          ) : featuredProjects.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-text">Focus project</h3>
              <ProjectCardWithStreets
                key={featuredProjects[0].id}
                project={featuredProjects[0]}
                visibleBins={visibleBins}
                onStreetClick={handleStreetClick}
                onStreetBlur={handleStreetBlur}
              />
              {featuredProjects.length > 1 && (
                <Link
                  to={ROUTES.PROJECTS_LIST}
                  className="block text-center text-sm text-primary hover:underline"
                >
                  View all projects →
                </Link>
              )}
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={handleSync}
              disabled={syncing}
              className="w-full"
            >
              {syncing ? "Syncing…" : "Find my latest runs"}
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
            <Link to={ROUTES.PROJECTS_LIST} className="block">
              <Button variant="ghost" className="w-full" type="button">
                View all projects
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
