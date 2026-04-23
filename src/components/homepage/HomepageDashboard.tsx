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
  MapFilterCard,
  ALL_BINS,
  type MapViewHighlightFocus,
} from "../map";
import type { FilterStatus } from "../../utils/street-filters";
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
import { normalizeStreetName } from "../../utils/normalize-street-name";
import { MetricsStrip } from "./MetricsStrip";
import { HomepageSkeleton } from "./HomepageSkeleton";
import { RecentRuns } from "./RecentRuns";
import { RunSuggestions, type ScrollItem } from "./RunSuggestions";
import { ProjectStatsCard } from "./ProjectStatsCard";

const DEFAULT_MAP_CENTER = { lat: 50.8, lng: -1.09 };

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
  "block w-full rounded-[var(--radius-button)] bg-gradient-to-r from-accent-from to-accent-to px-4 py-2.5 text-center text-sm font-semibold text-white no-underline shadow-card transition-all hover:brightness-95";

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
        const suggestionNames = new Set(
          backendStreets.map((st) => normalizeStreetName(st.name)),
        );

        const matchingBaseIds = streets
          .filter((seg) => suggestionNames.has(normalizeStreetName(seg.name)))
          .map((seg) => normalizeOsmId(seg.osmId));

        const backendIds = backendStreets.map((st) => normalizeOsmId(st.osmId));
        setHighlightOsmIds([...new Set([...matchingBaseIds, ...backendIds])]);

        const baseStreetNames = new Set(
          streets.map((seg) => normalizeStreetName(seg.name)),
        );
        const overlayNeeded = backendStreets.filter(
          (st) => !baseStreetNames.has(normalizeStreetName(st.name)),
        );
        const mapStreetOverlays: MapStreet[] = overlayNeeded.map((st) => ({
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

  const mapFilterSection = (
    <MapFilterCard
      streets={streets}
      visibleBins={visibleBins}
      onToggleBin={toggleBin}
      onToggleAll={() =>
        allBinsActive
          ? setVisibleBins(new Set())
          : setVisibleBins(new Set(ALL_BINS))
      }
      allBinsActive={allBinsActive}
      showTraces={showTraces}
      onToggleTraces={() => setShowTraces((v) => !v)}
    />
  );

  return (
    <div className="flex min-h-full flex-col md:h-full md:flex-row md:overflow-hidden">
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
            <div className="absolute left-3 top-3 z-[1000] flex flex-col gap-2">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text shadow-lg hover:bg-card-bg"
                onClick={resetMapFocus}
              >
                <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8H4M4 8l3-3M4 8l3 3" />
                </svg>
                Exit suggested run view
              </button>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface/90 px-3 py-1.5 text-[11px] font-medium text-text-muted shadow-lg backdrop-blur-sm">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-4 rounded-sm" style={{ backgroundColor: "#38bdf8" }} />
                  New
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-4 rounded-sm" style={{ backgroundColor: "#fb7185" }} />
                  To finish
                </span>
              </div>
            </div>
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

      <aside className="flex flex-col border-border bg-bg md:min-h-0 md:w-[400px] md:flex-none md:overflow-y-auto md:border-l-2">
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
                <MetricsStrip
                  streetTotals={homepage.streetTotals}
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
                <MetricsStrip
                  streetTotals={homepage.streetTotals}
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
