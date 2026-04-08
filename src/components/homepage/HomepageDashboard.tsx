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
import type { UseSyncStatusResult } from "../../hooks/useSyncStatus";
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
import {
  bboxToPolygonRing,
  bufferHull,
  convexHull,
} from "../../utils/convex-hull";
import { normalizeOsmId } from "../../utils/map-utils";
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

const BIN_CONFIG: {
  key: FilterStatus;
  color: string;
  activeBg: string;
  label: string;
  description: string;
}[] = [
  { key: "completed", color: "bg-success", activeBg: "bg-success/15 ring-success/40 text-success", label: "Done", description: "100%" },
  { key: "almostThere", color: "bg-amber-500", activeBg: "bg-amber-500/15 ring-amber-500/40 text-amber-600 dark:text-amber-400", label: "Almost done", description: "50%+" },
  { key: "inProgress", color: "bg-cyan-500", activeBg: "bg-cyan-500/15 ring-cyan-500/40 text-cyan-600 dark:text-cyan-400", label: "Just started", description: "1–49%" },
  { key: "notStarted", color: "bg-neutral-400 dark:bg-neutral-500", activeBg: "bg-neutral-400/15 ring-neutral-400/40 text-text-muted", label: "To go", description: "Not run yet" },
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
  syncStatus: UseSyncStatusResult;
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
  syncStatus,
}: HomepageDashboardProps) {
  const preferences = usePreferences();
  const [visibleBins, setVisibleBins] = useState<Set<FilterStatus>>(
    () => new Set(ALL_BINS),
  );
  const [showTraces, setShowTraces] = useState(false);
  const [highlightFocus, setHighlightFocus] =
    useState<MapViewHighlightFocus | null>(null);
  const [highlightOsmIds, setHighlightOsmIds] = useState<string[]>([]);
  const [highlightTraceActivityId, setHighlightTraceActivityId] = useState<
    string | null
  >(null);
  const [areaOverlay, setAreaOverlay] = useState<{
    polygon: [number, number][];
  } | null>(null);
  const [suggestionFocusActive, setSuggestionFocusActive] = useState(false);
  const savedBinsRef = useRef<Set<FilterStatus> | null>(null);
  const savedTracesRef = useRef<boolean | null>(null);
  const [runFocusActive, setRunFocusActive] = useState(false);
  const [overlayStreets, setOverlayStreets] = useState<MapStreet[]>([]);

  const mapRef = useRef<HTMLDivElement>(null);

  const mergedStreets = useMemo(() => {
    if (overlayStreets.length === 0) return streets;
    const existingIds = new Set(streets.map((s) => s.osmId));
    const extras = overlayStreets.filter((s) => !existingIds.has(s.osmId));
    return extras.length > 0 ? [...streets, ...extras] : streets;
  }, [streets, overlayStreets]);

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
    setOverlayStreets([]);
    if ((suggestionFocusActive || runFocusActive) && savedBinsRef.current) {
      setVisibleBins(savedBinsRef.current);
      savedBinsRef.current = null;
    }
    if (runFocusActive && savedTracesRef.current !== null) {
      setShowTraces(savedTracesRef.current);
      savedTracesRef.current = null;
    }
    setSuggestionFocusActive(false);
    setRunFocusActive(false);
  }, [suggestionFocusActive, runFocusActive]);

  const focusClusterArea = useCallback(
    (s: HomepageSuggestion) => {
      suppressViewport(1700);
      setHighlightTraceActivityId(null);

      savedBinsRef.current = new Set(visibleBins);
      setVisibleBins(new Set());
      setSuggestionFocusActive(true);

      const backendStreets = s.streets ?? [];

      if (backendStreets.length > 0) {
        const osmIds = backendStreets.map((st) => normalizeOsmId(st.osmId));
        setHighlightOsmIds(osmIds);

        const mapStreetOverlays: MapStreet[] = backendStreets.map((st) => ({
          osmId: st.osmId,
          name: st.name,
          highwayType: "residential",
          lengthMeters: 0,
          percentage: st.percentage,
          status: st.percentage >= 100 ? ("completed" as const) : ("partial" as const),
          geometry: st.geometry,
          stats: {
            runCount: 0,
            completionCount: 0,
            firstRunDate: null,
            lastRunDate: null,
            totalLengthMeters: 0,
            currentPercentage: st.percentage,
            everCompleted: st.percentage >= 100,
            weightedCompletionRatio: st.percentage / 100,
            segmentCount: 1,
            connectorCount: 0,
          },
        }));
        setOverlayStreets(mapStreetOverlays);

        const rawPoints: [number, number][] = [];
        for (const st of backendStreets) {
          for (const c of st.geometry.coordinates) {
            if (c.length >= 2 && Number.isFinite(c[0]) && Number.isFinite(c[1])) {
              rawPoints.push([c[1], c[0]]);
            }
          }
        }

        let ring: [number, number][] = [];
        if (rawPoints.length >= 3) {
          const hull = convexHull(rawPoints);
          const buffered = hull.length >= 3 ? bufferHull(hull, 30) : [];
          ring = buffered.length >= 3 ? buffered : isValidBbox(s.focus.bbox) ? bboxToPolygonRing(s.focus.bbox) : [];
        } else if (isValidBbox(s.focus.bbox)) {
          ring = bboxToPolygonRing(s.focus.bbox);
        }
        setAreaOverlay(ring.length >= 3 ? { polygon: ring } : null);

        if (rawPoints.length > 0) {
          const lats = rawPoints.map(([lat]) => lat);
          const lngs = rawPoints.map(([, lng]) => lng);
          setHighlightFocus({
            bbox: [Math.min(...lats), Math.min(...lngs), Math.max(...lats), Math.max(...lngs)],
          });
        } else if (isValidBbox(s.focus.bbox)) {
          setHighlightFocus({ bbox: s.focus.bbox });
        }
      } else {
        const ids = matchStreetIdsToOsmIds(s.focus.streetIds, streets);
        setHighlightOsmIds(ids);
        setOverlayStreets([]);
        setAreaOverlay(null);
        if (isValidBbox(s.focus.bbox)) {
          setHighlightFocus({ bbox: s.focus.bbox });
        } else {
          setHighlightFocus(null);
        }
      }
    },
    [streets, visibleBins, suppressViewport],
  );

  const focusRecentRun = useCallback(
    (activityId: string, bbox: [number, number, number, number]) => {
      suppressViewport(1700);
      setHighlightOsmIds([]);
      setOverlayStreets([]);
      setAreaOverlay(null);

      if (!runFocusActive) {
        savedBinsRef.current = new Set(visibleBins);
        savedTracesRef.current = showTraces;
      }
      setVisibleBins(new Set());
      setShowTraces(true);
      setRunFocusActive(true);

      if (suggestionFocusActive) {
        setSuggestionFocusActive(false);
      }

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
        setHighlightFocus({ bbox: paddedBbox });
      } else {
        setHighlightFocus(null);
      }
    },
    [suppressViewport, suggestionFocusActive, runFocusActive, visibleBins, showTraces],
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

  const noneActive = visibleBins.size === 0;

  const mapFilterSection = streets.length > 0 ? (
    <Card padding="none" className="w-full p-3">
      <div className="flex items-center justify-between">
        <SectionHeading>Streets on map</SectionHeading>
        <button
          type="button"
          className="text-[11px] font-medium text-text-muted underline decoration-border underline-offset-2 hover:text-text"
          onClick={() =>
            allBinsActive
              ? setVisibleBins(new Set())
              : setVisibleBins(new Set(ALL_BINS))
          }
        >
          {allBinsActive ? "Hide all" : "Show all"}
        </button>
      </div>
      <p className="mb-2.5 text-[11px] text-text-muted">
        Toggle which streets appear on the map
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {BIN_CONFIG.map(({ key, color, activeBg, label, description }) => {
          const active = visibleBins.has(key);
          const count = binCounts[key];
          return (
            <button
              key={key}
              type="button"
              className={`group flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-all ${
                active
                  ? `${activeBg} ring-1 ring-inset`
                  : "bg-bg text-text-muted/60 hover:bg-bg/80"
              }`}
              onClick={() => toggleBin(key)}
            >
              <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${active ? `${color} border-transparent` : "border-neutral-300 dark:border-neutral-600"}`}>
                {active && (
                  <svg viewBox="0 0 16 16" className="size-3 text-white">
                    <path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-tight">
                  {count} <span className="font-semibold">street{count !== 1 ? "s" : ""}</span>
                </span>
                <span className={`block text-[11px] leading-tight ${active ? "" : "text-text-muted/50"}`}>
                  {label} · {description}
                </span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          className={`col-span-2 flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all ${
            showTraces
              ? "bg-violet-500/15 ring-1 ring-inset ring-violet-500/40 text-violet-600 dark:text-violet-400"
              : "bg-bg text-text-muted/60 hover:bg-bg/80"
          }`}
          onClick={() => setShowTraces((v) => !v)}
        >
          <span className={`flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${showTraces ? "border-transparent bg-violet-500" : "border-neutral-300 dark:border-neutral-600"}`}>
            {showTraces && (
              <svg viewBox="0 0 16 16" className="size-3 text-white">
                <path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold leading-tight">Run traces</span>
            <span className={`block text-[11px] leading-tight ${showTraces ? "" : "text-text-muted/50"}`}>
              Strava GPS lines
            </span>
          </span>
        </button>
      </div>
      {noneActive && !showTraces && (
        <p className="mt-2 text-center text-[11px] text-text-muted/70">
          All map layers hidden
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
            streets={mergedStreets}
            gpsTraces={showTraces ? gpsTraces : []}
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
          {suggestionFocusActive && (
            <button
              type="button"
              className="absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text shadow-lg hover:bg-card-bg"
              onClick={resetMapFocus}
            >
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8H4M4 8l3-3M4 8l3 3" />
              </svg>
              Exit suggested run view
            </button>
          )}
          {!suggestionFocusActive &&
            (highlightFocus?.bbox ||
              highlightOsmIds.length > 0 ||
              highlightTraceActivityId) && (
            <button
              type="button"
              className="absolute left-3 top-3 z-[1000] flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-text shadow-lg transition-colors hover:bg-card-bg"
              onClick={resetMapFocus}
            >
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8H4M4 8l3-3M4 8l3 3" />
              </svg>
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
