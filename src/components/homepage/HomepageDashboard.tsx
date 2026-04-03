/**
 * Homepage: map + dense infographic side panel. Panel controls map focus, trace highlight, legend bins.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { Link } from "react-router-dom";
import {
  UnifiedMap,
  MAP_ZOOM,
  LocationAccessBanner,
  type MapViewHighlightFocus,
} from "../map";
import { getStreetBin, type FilterStatus } from "../../utils/street-filters";
import { usePreferences } from "../../contexts/PreferencesContext";
import { useSyncStatus } from "../../hooks/useSyncStatus";
import { Card, SectionHeading } from "../common";
import type {
  HomepagePayload,
  HomepageSuggestion,
} from "../../services/homepage.service";
import type { MapStreet, GpsTrace } from "../../types/api.types";
import {
  matchStreetIdsToOsmIds,
  isValidBbox,
} from "../../utils/homepage-map-focus";
import { HomepageMetrics } from "./HomepageMetrics";
import { HomepageSkeleton } from "./HomepageSkeleton";
import { RecentRuns } from "./RecentRuns";
import { RunSuggestions, type ScrollItem } from "./RunSuggestions";
import { ProjectStatsCard } from "./ProjectStatsCard";

const DEFAULT_MAP_CENTER = { lat: 50.8, lng: -1.09 };
const ALL_BINS: FilterStatus[] = [
  "completed",
  "almostThere",
  "inProgress",
  "notStarted",
];

const BIN_CONFIG: { key: FilterStatus; dotClass: string; label: string }[] = [
  { key: "completed", dotClass: "bg-success", label: "done" },
  { key: "almostThere", dotClass: "bg-amber-500", label: "almost" },
  { key: "inProgress", dotClass: "bg-cyan-500", label: "in progress" },
  { key: "notStarted", dotClass: "bg-neutral-400 dark:bg-neutral-500", label: "to go" },
];

type RunScrollItem = ScrollItem;

export interface HomepageDashboardProps {
  userLocation: { lat: number; lng: number } | null;
  mapCenter: { lat: number; lng: number } | null;
  streets: MapStreet[];
  gpsTraces?: GpsTrace[];
  onViewportChange: (center: { lat: number; lng: number }) => void;
  /** Skip viewport-driven fetch (programmatic fitBounds). */
  skipViewportFetchRef?: MutableRefObject<boolean>;
  showLocationAccessBanner?: boolean;
  locationErrorMessage?: string;
  onRetryLocation?: () => void;
  homepage: HomepagePayload | null;
  homepageLoading: boolean;
}

const MAX_SUGGESTIONS = 4;

function buildRunSuggestionItems(homepage: HomepagePayload): RunScrollItem[] {
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

const ctaGradientClass =
  "inline-flex w-full items-center justify-center rounded-card bg-gradient-to-r from-accent-from to-accent-to px-4 py-2 text-sm font-semibold text-white shadow-card transition-opacity hover:opacity-95";

export function HomepageDashboard({
  userLocation,
  mapCenter,
  streets,
  gpsTraces = [],
  onViewportChange,
  skipViewportFetchRef,
  showLocationAccessBanner = false,
  locationErrorMessage,
  onRetryLocation,
  homepage,
  homepageLoading,
}: HomepageDashboardProps) {
  const preferences = usePreferences();
  const syncStatus = useSyncStatus();
  const [visibleBins, setVisibleBins] = useState<Set<FilterStatus>>(
    () => new Set(ALL_BINS),
  );
  const [highlightFocus, setHighlightFocus] =
    useState<MapViewHighlightFocus | null>(null);
  const [highlightOsmIds, setHighlightOsmIds] = useState<string[]>([]);
  const [highlightTraceActivityId, setHighlightTraceActivityId] = useState<
    string | null
  >(null);
  const [areaOverlay, setAreaOverlay] = useState<{
    center: { lat: number; lng: number };
    radiusM: number;
  } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);

  const suppressViewport = useCallback(
    (ms: number) => {
      if (skipViewportFetchRef) {
        skipViewportFetchRef.current = true;
        setTimeout(() => {
          skipViewportFetchRef.current = false;
        }, ms);
      }
    },
    [skipViewportFetchRef],
  );

  const resetMapFocus = useCallback(() => {
    setHighlightFocus(null);
    setHighlightOsmIds([]);
    setHighlightTraceActivityId(null);
    setAreaOverlay(null);
  }, []);

  const focusClusterArea = useCallback(
    (s: HomepageSuggestion) => {
      suppressViewport(1700);
      setHighlightTraceActivityId(null);
      const bbox = s.focus.bbox;
      setHighlightFocus(isValidBbox(bbox) ? { bbox } : null);
      const ids = matchStreetIdsToOsmIds(s.focus.streetIds, streets);
      setHighlightOsmIds(ids);
      if (isValidBbox(bbox)) {
        const centerLat = (bbox[0] + bbox[2]) / 2;
        const centerLng = (bbox[1] + bbox[3]) / 2;
        const latSpan = Math.abs(bbox[2] - bbox[0]);
        const lngSpan = Math.abs(bbox[3] - bbox[1]);
        const avgLatRad = (centerLat * Math.PI) / 180;
        const latM = latSpan * 111_320;
        const lngM = lngSpan * 111_320 * Math.cos(avgLatRad);
        const radiusM = Math.max(latM, lngM) / 2 + 50;
        setAreaOverlay({ center: { lat: centerLat, lng: centerLng }, radiusM });
      }
    },
    [streets, suppressViewport],
  );

  const focusRecentRun = useCallback(
    (activityId: string, bbox: [number, number, number, number]) => {
      suppressViewport(1700);
      setHighlightOsmIds([]);
      setHighlightTraceActivityId(activityId);
      setHighlightFocus(isValidBbox(bbox) ? { bbox } : null);
    },
    [suppressViewport],
  );

  const toggleBin = useCallback((bin: FilterStatus) => {
    setVisibleBins((prev) => {
      const next = new Set(prev);
      if (next.has(bin)) {
        next.delete(bin);
        if (next.size === 0) return new Set(ALL_BINS);
        return next;
      }
      next.add(bin);
      return next;
    });
  }, []);

  const prefStreetFilter = preferences?.preferences?.defaultStreetFilter;
  useEffect(() => {
    if (prefStreetFilter && prefStreetFilter !== "all") {
      setVisibleBins(new Set([prefStreetFilter as FilterStatus]));
    }
  }, [prefStreetFilter]);

  const effectiveMapCenter = useMemo(
    () => mapCenter ?? userLocation,
    [mapCenter?.lat, mapCenter?.lng, userLocation?.lat, userLocation?.lng],
  );

  const mapZoom = useMemo(
    () =>
      userLocation
        ? MAP_ZOOM.USER_LOCATION
        : (preferences?.preferences?.defaultMapZoom ?? MAP_ZOOM.DEFAULT),
    [userLocation, preferences?.preferences?.defaultMapZoom],
  );

  const binCounts = useMemo(() => {
    const counts = {
      completed: 0,
      almostThere: 0,
      inProgress: 0,
      notStarted: 0,
    };
    for (const s of streets) {
      const completed = s.status === "completed";
      const bin = getStreetBin(s.percentage ?? 0, completed);
      if (bin !== "all") counts[bin]++;
    }
    return counts;
  }, [streets]);

  const greeting = homepage?.userName
    ? homepage.userState === "brand_new" || homepage.userState === "syncing"
      ? `Welcome, ${homepage.userName}`
      : `Hey, ${homepage.userName}`
    : null;

  const areaTotal = homepage?.areaStats?.totalStreets ?? streets.length;

  const runSuggestionItems = useMemo(() => {
    if (!homepage) return [];
    return buildRunSuggestionItems(homepage);
  }, [homepage]);

  const syncingSuggestionItems = useMemo((): RunScrollItem[] => {
    if (!homepage || homepage.userState !== "syncing") return [];
    return buildRunSuggestionItems(homepage);
  }, [homepage]);

  const allBinsActive = visibleBins.size === ALL_BINS.length;

  const mapFilterSection = streets.length > 0 ? (
    <Card padding="none" className="w-full p-3">
      <SectionHeading>Map filter</SectionHeading>
      <div className="flex flex-wrap gap-2">
        {BIN_CONFIG.map(({ key, dotClass, label }) => {
          const active = visibleBins.has(key);
          return (
            <button
              key={key}
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:opacity-90 ${
                active
                  ? "bg-card-bg ring-1 ring-border"
                  : "bg-card-bg opacity-40"
              }`}
              onClick={() => toggleBin(key)}
            >
              <span
                className={`size-2 shrink-0 rounded-full ${dotClass}`}
                aria-hidden
              />
              {binCounts[key]} {label}
            </button>
          );
        })}
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:opacity-90 ${
            allBinsActive
              ? "bg-card-bg ring-1 ring-border"
              : "bg-card-bg opacity-40"
          }`}
          onClick={() => setVisibleBins(new Set(ALL_BINS))}
        >
          All
        </button>
      </div>
      {homepage?.totalActivities != null && (
        <p className="mt-2 text-xs text-text-muted">
          {homepage.totalActivities} runs logged
          {homepage.totalDistanceKm != null
            ? ` · ${homepage.totalDistanceKm} km total`
            : ""}
        </p>
      )}
    </Card>
  ) : null;

  return (
    <div className="flex h-full flex-col overflow-hidden md:flex-row">
      <div className="relative h-[45vh] w-full shrink-0 md:h-full md:min-h-0 md:flex-1 md:shrink">
        <div ref={mapRef} className="relative h-full w-full">
          <UnifiedMap
            center={effectiveMapCenter ?? DEFAULT_MAP_CENTER}
            zoom={mapZoom}
            userLocation={userLocation}
            showUserLocationMarker
            streets={streets}
            gpsTraces={gpsTraces}
            highlightFocus={highlightFocus}
            highlightOsmIds={highlightOsmIds}
            highlightTraceActivityId={highlightTraceActivityId}
            onViewportChange={onViewportChange}
            showLegend
            showLegendGuide={false}
            areaOverlay={areaOverlay}
            visibleStreetBins={visibleBins}
            onVisibleStreetBinsChange={setVisibleBins}
            className="h-full w-full"
            isLoading={false}
          />
          {(highlightFocus?.bbox ||
            highlightOsmIds.length > 0 ||
            highlightTraceActivityId ||
            areaOverlay) && (
            <button
              type="button"
              className="absolute left-3 top-3 z-[1000] rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-md hover:opacity-90"
              onClick={resetMapFocus}
            >
              Back to overview
            </button>
          )}
        </div>
      </div>

      <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto border-border bg-bg md:w-[400px] md:flex-none md:border-l-2">
        {showLocationAccessBanner &&
          locationErrorMessage &&
          onRetryLocation && (
            <div className="border-b-2 border-border p-4">
              <LocationAccessBanner
                error={locationErrorMessage}
                onRetry={onRetryLocation}
              />
            </div>
          )}

        {homepageLoading && !homepage ? (
          <HomepageSkeleton />
        ) : (
          <div className="flex flex-col gap-3 p-3 md:p-4">
            {greeting && (
              <p className="text-lg font-bold text-text">{greeting}</p>
            )}

            {/* Syncing */}
            {homepage?.userState === "syncing" && (
              <>
                <Card padding="none" className="w-full p-3">
                  <SectionHeading>Importing</SectionHeading>
                  <p className="text-sm font-medium text-text">
                    Importing your runs…{" "}
                    {syncStatus.total > 0
                      ? `${syncStatus.processed} of ${syncStatus.total}`
                      : ""}
                  </p>
                  {homepage.areaStats != null && (
                    <p className="mt-1 text-xs text-text-muted">
                      {homepage.areaStats.totalStreets} streets in this area
                    </p>
                  )}
                </Card>
                <RecentRuns
                  lastRun={homepage.lastRun}
                  runs={homepage.recentRuns}
                  onSelect={focusRecentRun}
                />
                {syncingSuggestionItems.length > 0 && (
                  <RunSuggestions
                    items={syncingSuggestionItems}
                    onViewArea={focusClusterArea}
                  />
                )}
              </>
            )}

            {/* Brand new: area + map filter + suggestions + CTA */}
            {homepage?.userState === "brand_new" && (
              <>
                <Card padding="none" className="w-full p-3">
                  <SectionHeading>Your area</SectionHeading>
                  <p className="text-lg font-bold text-text">
                    {areaTotal > 0
                      ? `${areaTotal} streets around you`
                      : "Explore your area"}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Tap a card to see it on the map
                  </p>
                </Card>
                {mapFilterSection}
                {runSuggestionItems.length > 0 && (
                  <RunSuggestions
                    items={runSuggestionItems}
                    onViewArea={focusClusterArea}
                  />
                )}
                <Link to="/projects/new" className={ctaGradientClass}>
                  Create a project
                </Link>
              </>
            )}

            {/* Has runs, no project */}
            {homepage?.userState === "has_runs_no_project" && (
              <>
                <HomepageMetrics
                  totalDistanceKm={homepage.totalDistanceKm}
                  totalActivities={homepage.totalActivities}
                />
                <RecentRuns
                  lastRun={homepage.lastRun}
                  runs={homepage.recentRuns}
                  onSelect={focusRecentRun}
                />
                {mapFilterSection}
                {runSuggestionItems.length > 0 && (
                  <RunSuggestions
                    items={runSuggestionItems}
                    onViewArea={focusClusterArea}
                  />
                )}
                <Link to="/projects/new" className={ctaGradientClass}>
                  Start tracking your streets
                </Link>
              </>
            )}

            {/* Active: project stats + metrics + runs + filter + suggestions */}
            {homepage?.userState === "active" && (
              <>
                {homepage.projectContext && (
                  <ProjectStatsCard
                    projectId={homepage.projectContext.id}
                    name={homepage.projectContext.name}
                    totalStreets={homepage.projectContext.totalStreets}
                    completedStreets={homepage.projectContext.completedStreets}
                    progress={homepage.projectContext.progress}
                  />
                )}
                <HomepageMetrics
                  totalDistanceKm={homepage.totalDistanceKm}
                  totalActivities={homepage.totalActivities}
                />
                <RecentRuns
                  lastRun={homepage.lastRun}
                  runs={homepage.recentRuns}
                  onSelect={focusRecentRun}
                />
                {mapFilterSection}
                {runSuggestionItems.length > 0 && (
                  <RunSuggestions
                    items={runSuggestionItems}
                    onViewArea={focusClusterArea}
                  />
                )}
                <Link to="/projects/new" className={ctaGradientClass}>
                  Create another project
                </Link>
              </>
            )}

            {/* Project processing notice */}
            {homepage?.userState === "project_processing" && (
              <Card padding="none" className="w-full p-3">
                <p className="text-sm text-text-muted">
                  Processing your project…
                </p>
              </Card>
            )}

            {/* Empty brand_new */}
            {homepage &&
              homepage.userState === "brand_new" &&
              !homepage.primarySuggestion &&
              !homepage.firstStreet &&
              streets.length === 0 && (
                <Card padding="none" className="w-full p-3">
                  <p className="text-center text-sm text-text-muted">
                    Connect Strava to see your streets on the map.
                  </p>
                </Card>
              )}
          </div>
        )}
      </aside>
    </div>
  );
}
