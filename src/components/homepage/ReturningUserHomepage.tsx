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
import { Skeleton } from "../common";
import type { HomepagePayload, HomepageSuggestion } from "../../services/homepage.service";
import type { MapStreet, GpsTrace } from "../../types/api.types";
import { matchStreetIdsToOsmIds, isValidBbox } from "../../utils/homepage-map-focus";
import { normalizeOsmId } from "../../utils/map-utils";

const DEFAULT_MAP_CENTER = { lat: 50.8, lng: -1.09 };
const ALL_BINS: FilterStatus[] = ["completed", "almostThere", "inProgress", "notStarted"];
const PANEL_CARD = "w-full rounded-card bg-card-bg p-4 shadow-card";

const TYPE_LABELS: Record<string, { label: string; accent: string }> = {
  quick_win: { label: "Quick win", accent: "bg-success/15 text-success" },
  explore: { label: "New street", accent: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  streak_saver: { label: "Streak saver", accent: "bg-warning/15 text-warning" },
  milestone_push: { label: "Milestone push", accent: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
  repeat_street: { label: "Keep going", accent: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
};

type NearbyStreet = NonNullable<HomepagePayload["nearbyStreets"]>[number];

type ScrollItem =
  | { kind: "suggestion"; suggestion: HomepageSuggestion; isPrimary: boolean }
  | { kind: "street"; street: NearbyStreet; isPrimary: boolean };

function formatDaysAgo(daysAgo: number): string {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return `${daysAgo}d ago`;
  if (daysAgo < 14) return "1w ago";
  const weeks = Math.floor(daysAgo / 7);
  return `${weeks}w ago`;
}

function formatRunRecency(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "";
  const daysAgo = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000)),
  );
  return formatDaysAgo(daysAgo);
}

function PanelSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">{children}</h3>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}

export interface ReturningUserHomepageProps {
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

function buildRunSuggestionItems(homepage: HomepagePayload): ScrollItem[] {
  if (homepage.userState === "brand_new") {
    const list = homepage.nearbyStreets?.length
      ? homepage.nearbyStreets
      : homepage.firstStreet
        ? [homepage.firstStreet]
        : [];
    return list.map((st, i) => ({
      kind: "street" as const,
      street: st,
      isPrimary: i === 0,
    }));
  }

  const out: ScrollItem[] = [];
  if (homepage.primarySuggestion) {
    out.push({
      kind: "suggestion",
      suggestion: homepage.primarySuggestion,
      isPrimary: true,
    });
  } else if (homepage.firstStreet) {
    out.push({
      kind: "street",
      street: homepage.firstStreet,
      isPrimary: true,
    });
  }
  for (const alt of homepage.alternates) {
    out.push({ kind: "suggestion", suggestion: alt, isPrimary: false });
  }
  return out;
}

function estimateRunMinutes(distanceM: number): string {
  const mins = Math.round((distanceM / 1000) * 6);
  if (mins < 1) return "<1 min";
  return `~${mins} min`;
}

function RunSuggestionsScroll({
  items,
  onFocusSuggestion,
  onFocusStreet,
  onViewArea,
}: {
  items: ScrollItem[];
  onFocusSuggestion: (s: HomepageSuggestion) => void;
  onFocusStreet: (osmId: string, bbox: [number, number, number, number]) => void;
  onViewArea: (s: HomepageSuggestion) => void;
}) {
  if (items.length === 0) return null;
  const stripRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ dragging: false, startX: 0, startScrollLeft: 0 });
  const [activeDot, setActiveDot] = useState(0);

  const updateActiveDot = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth;
    if (cardWidth <= 0) return;
    const next = Math.round(el.scrollLeft / cardWidth);
    setActiveDot(Math.max(0, Math.min(items.length - 1, next)));
  }, [items.length]);

  const onMouseDown = (event: { clientX: number }) => {
    const el = stripRef.current;
    if (!el) return;
    dragRef.current.dragging = true;
    dragRef.current.startX = event.clientX;
    dragRef.current.startScrollLeft = el.scrollLeft;
  };

  const onMouseMove = (event: { clientX: number }) => {
    if (!dragRef.current.dragging) return;
    const el = stripRef.current;
    if (!el) return;
    const deltaX = event.clientX - dragRef.current.startX;
    el.scrollLeft = dragRef.current.startScrollLeft - deltaX;
  };

  const stopDragging = () => {
    dragRef.current.dragging = false;
  };

  const jumpToCard = (index: number) => {
    const el = stripRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth;
    el.scrollTo({ left: index * cardWidth, behavior: "smooth" });
  };

  return (
    <div className={PANEL_CARD}>
      <PanelSectionHeading>Next run suggestions</PanelSectionHeading>
      <div
        ref={stripRef}
        className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto pb-2 select-none cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={stopDragging}
        onMouseUp={stopDragging}
        onScroll={updateActiveDot}
      >
        {items.map((item, idx) => {
          if (item.kind === "suggestion") {
            const s = item.suggestion;
            const isCluster = !!s.clusterStats;
            const nonClusterBadge =
              !isCluster && s.type ? TYPE_LABELS[s.type] : null;
            return (
              <div
                key={`s-${s.cooldownKey}-${idx}`}
                className="w-full min-w-full shrink-0 snap-start rounded-card border border-border/60 bg-surface p-4 text-left shadow-sm"
              >
                {nonClusterBadge && (
                  <span
                    className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${nonClusterBadge.accent}`}
                  >
                    {nonClusterBadge.label}
                  </span>
                )}
                <p className="text-sm font-bold leading-snug text-text">{s.title}</p>
                {isCluster ? (
                  <>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-card-bg px-3 py-2.5">
                        <p className="text-lg font-bold leading-tight text-success">
                          {s.clusterStats!.newStreets}
                        </p>
                        <p className="text-[11px] leading-tight text-text-muted">streets to discover</p>
                      </div>
                      <div className="rounded-lg bg-card-bg px-3 py-2.5">
                        <p className="text-lg font-bold leading-tight text-amber-500">
                          {s.clusterStats!.toFinish}
                        </p>
                        <p className="text-[11px] leading-tight text-text-muted">streets to finish</p>
                      </div>
                      <div className="rounded-lg bg-card-bg px-3 py-2.5">
                        <p className="text-lg font-bold leading-tight text-text">
                          ~{(s.clusterStats!.estimatedDistanceM / 1000).toFixed(1)}<span className="text-xs font-semibold"> km</span>
                        </p>
                        <p className="text-[11px] leading-tight text-text-muted">total distance</p>
                      </div>
                      <div className="rounded-lg bg-card-bg px-3 py-2.5">
                        <p className="text-lg font-bold leading-tight text-text">
                          {estimateRunMinutes(s.clusterStats!.estimatedDistanceM)}
                        </p>
                        <p className="text-[11px] leading-tight text-text-muted">est. run time</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-card border border-border px-3 py-2 text-xs font-semibold text-text transition-colors hover:bg-border/10"
                      onClick={() => onViewArea(s)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      View area on map
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-text-muted">{s.shortCopy}</p>
                    <button
                      type="button"
                      className="mt-3 inline-flex cursor-pointer items-center rounded-card border border-border px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-border/10"
                      onClick={() => onFocusSuggestion(s)}
                    >
                      Show on map
                    </button>
                  </>
                )}
              </div>
            );
          }
          const st = item.street;
          return (
            <div
              key={`st-${st.osmId}-${idx}`}
              className="w-full min-w-full shrink-0 snap-start rounded-card border border-border/60 bg-surface p-4 text-left shadow-sm"
            >
              <span className="mb-2 inline-block rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                New street
              </span>
              <p className="text-sm font-bold text-text">{st.name}</p>
              <p className="mt-1 text-xs text-text-muted">
                {Math.round(st.lengthMeters)}m · {Math.round(st.distanceFromUser)}m away
              </p>
              <button
                type="button"
                className="mt-3 inline-flex cursor-pointer items-center rounded-card border border-border px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-border/10"
                onClick={() => onFocusStreet(st.osmId, st.bbox)}
              >
                Show on map
              </button>
            </div>
          );
        })}
      </div>
      {items.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {items.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              type="button"
              className={`size-2 rounded-full transition-opacity ${
                idx === activeDot ? "bg-text opacity-90" : "bg-text-muted/40 opacity-70"
              }`}
              onClick={() => jumpToCard(idx)}
              aria-label={`Show suggestion ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecentRunsCompact({
  runs,
  onSelect,
}: {
  runs: NonNullable<HomepagePayload["recentRuns"]>;
  onSelect: (activityId: string, bbox: [number, number, number, number]) => void;
}) {
  const displayed = runs.slice(0, 3);
  if (displayed.length === 0) return null;
  return (
    <div className={PANEL_CARD}>
      <PanelSectionHeading>Recent runs</PanelSectionHeading>
      <ul className="space-y-0 divide-y divide-border/60">
        {displayed.map((r) => (
          <li key={r.activityId}>
            <button
              type="button"
              className="w-full py-2 text-left text-sm transition-colors hover:bg-border/5"
              onClick={() => onSelect(r.activityId, r.bbox)}
            >
              <span className="font-medium text-text">{r.name}</span>
              <span className="text-text-muted"> · </span>
              <span className="text-text-muted">{r.distanceKm} km</span>
              {formatRunRecency(r.date) && (
                <>
                  <span className="text-text-muted"> · </span>
                  <span className="text-text-muted">{formatRunRecency(r.date)}</span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricBlocks({
  totalDistanceKm,
  totalActivities,
}: {
  totalDistanceKm: number | null | undefined;
  totalActivities: number | null | undefined;
}) {
  const kmDisplay =
    totalDistanceKm != null ? `${totalDistanceKm.toFixed(2)} km` : "—";
  const runs = totalActivities != null ? String(totalActivities) : "—";
  return (
    <div className={`${PANEL_CARD} p-5`}>
      <div className="flex gap-4">
        <div className="min-w-0 flex-1 border-border/40 pr-4 sm:border-r">
          <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Total Distance
          </p>
          <p className="mt-1 whitespace-nowrap text-2xl font-bold leading-tight text-text">
            {kmDisplay}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Total Runs
          </p>
          <p className="mt-1 whitespace-nowrap text-2xl font-bold leading-tight text-text">
            {runs}
          </p>
        </div>
      </div>
    </div>
  );
}

function LastRunCard({
  homepage,
  onShowOnMap,
}: {
  homepage: HomepagePayload;
  onShowOnMap: (activityId: string, bbox: [number, number, number, number]) => void;
}) {
  if (!homepage.lastRun) return null;
  return (
    <div className={PANEL_CARD}>
      <PanelSectionHeading>Last run</PanelSectionHeading>
      <p className="text-2xl font-bold leading-tight text-text">
        {formatDaysAgo(homepage.lastRun.daysAgo)} · {homepage.lastRun.distanceKm} km
        {homepage.lastRun.newStreets > 0 ? ` · +${homepage.lastRun.newStreets} streets` : ""}
      </p>
      {homepage.lastRun.activityId && homepage.lastRun.bbox ? (
        <button
          type="button"
          className="mt-2 inline-flex cursor-pointer items-center rounded-card border border-border px-3 py-1.5 text-sm font-semibold text-text transition-colors hover:bg-border/10"
          onClick={() => onShowOnMap(homepage.lastRun!.activityId!, homepage.lastRun!.bbox!)}
        >
          Show on map
        </button>
      ) : null}
      {(homepage.lastRun.completedStreetNames?.length ||
        homepage.lastRun.improvedStreetNames?.length) ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {homepage.lastRun.completedStreetNames?.map((name) => (
            <span
              key={`c-${name}`}
              className="inline-block rounded border border-border bg-surface px-1.5 py-0.5 text-xs text-text"
            >
              {name}
            </span>
          ))}
          {homepage.lastRun.improvedStreetNames?.map((name) => (
            <span
              key={`i-${name}`}
              className="inline-block rounded border border-border bg-surface px-1.5 py-0.5 text-xs text-text-muted"
            >
              {name}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const ctaGradientClass =
  "inline-flex w-full items-center justify-center rounded-card bg-gradient-to-r from-accent-from to-accent-to px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-opacity hover:opacity-95";

export function ReturningUserHomepage({
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
}: ReturningUserHomepageProps) {
  const preferences = usePreferences();
  const syncStatus = useSyncStatus();
  const [visibleBins, setVisibleBins] = useState<Set<FilterStatus>>(
    () => new Set(ALL_BINS),
  );
  const [highlightFocus, setHighlightFocus] = useState<MapViewHighlightFocus | null>(null);
  const [highlightOsmIds, setHighlightOsmIds] = useState<string[]>([]);
  const [highlightTraceActivityId, setHighlightTraceActivityId] = useState<string | null>(null);
  const [areaOverlay, setAreaOverlay] = useState<{ center: { lat: number; lng: number }; radiusM: number } | null>(null);

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

  const focusSuggestion = useCallback(
    (s: HomepageSuggestion) => {
      suppressViewport(1700);
      setHighlightTraceActivityId(null);
      setAreaOverlay(null);
      const bbox = s.focus.bbox;
      setHighlightFocus(isValidBbox(bbox) ? { bbox } : null);
      const ids = matchStreetIdsToOsmIds(s.focus.streetIds, streets);
      setHighlightOsmIds(ids);
    },
    [streets, suppressViewport],
  );

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

  const focusStreetByOsmId = useCallback(
    (osmId: string, bbox: [number, number, number, number]) => {
      suppressViewport(1700);
      setHighlightTraceActivityId(null);
      setHighlightFocus(isValidBbox(bbox) ? { bbox } : null);
      setHighlightOsmIds([normalizeOsmId(osmId)]);
    },
    [suppressViewport],
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
    const counts = { completed: 0, almostThere: 0, inProgress: 0, notStarted: 0 };
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

  const syncingSuggestionItems = useMemo((): ScrollItem[] => {
    if (!homepage || homepage.userState !== "syncing") return [];
    const out: ScrollItem[] = [];
    if (homepage.primarySuggestion) {
      out.push({
        kind: "suggestion",
        suggestion: homepage.primarySuggestion,
        isPrimary: true,
      });
    } else if (homepage.firstStreet) {
      out.push({ kind: "street", street: homepage.firstStreet, isPrimary: true });
    }
    for (const alt of homepage.alternates) {
      out.push({ kind: "suggestion", suggestion: alt, isPrimary: false });
    }
    return out;
  }, [homepage]);

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
          {(highlightFocus?.bbox || highlightOsmIds.length > 0 || highlightTraceActivityId || areaOverlay) && (
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
        {showLocationAccessBanner && locationErrorMessage && onRetryLocation && (
          <div className="border-b-2 border-border p-4">
            <LocationAccessBanner error={locationErrorMessage} onRetry={onRetryLocation} />
          </div>
        )}

        {homepageLoading && !homepage ? (
          <PanelSkeleton />
        ) : (
          <div className="flex flex-col gap-4 p-4 md:p-5">
            {greeting && <p className="text-xl font-bold text-text">{greeting}</p>}

            {/* Syncing */}
            {homepage?.userState === "syncing" && (
              <>
                <div className={PANEL_CARD}>
                  <PanelSectionHeading>Importing</PanelSectionHeading>
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
                </div>
                {homepage.recentRuns && homepage.recentRuns.length > 0 && (
                  <RecentRunsCompact runs={homepage.recentRuns} onSelect={focusRecentRun} />
                )}
                {syncingSuggestionItems.length > 0 && (
                  <RunSuggestionsScroll
                    items={syncingSuggestionItems}
                    onFocusSuggestion={focusSuggestion}
                    onFocusStreet={focusStreetByOsmId}
                    onViewArea={focusClusterArea}
                  />
                )}
              </>
            )}

            {/* Project header (active) */}
            {homepage?.userState === "active" && homepage.projectContext && (
              <div className={PANEL_CARD}>
                <PanelSectionHeading>Project</PanelSectionHeading>
                <h2 className="text-xl font-bold leading-tight text-text">{homepage.projectContext.name}</h2>
                <p className="mt-1 text-sm text-text-muted">
                  {homepage.projectContext.completedStreets} / {homepage.projectContext.totalStreets} streets ·{" "}
                  {Math.round(homepage.projectContext.progress)}%
                </p>
              </div>
            )}

            {/* Brand new: area + nearby scroll + CTA */}
            {homepage?.userState === "brand_new" && (
              <>
                <div className={PANEL_CARD}>
                  <PanelSectionHeading>Your area</PanelSectionHeading>
                  <p className="text-lg font-bold text-text">
                    {areaTotal > 0 ? `${areaTotal} streets around you` : "Explore your area"}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Tap a card to see it on the map</p>
                </div>
                {runSuggestionItems.length > 0 && (
                  <RunSuggestionsScroll
                    items={runSuggestionItems}
                    onFocusSuggestion={focusSuggestion}
                    onFocusStreet={focusStreetByOsmId}
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
                <MetricBlocks
                  totalDistanceKm={homepage.totalDistanceKm}
                  totalActivities={homepage.totalActivities}
                />
                <LastRunCard homepage={homepage} onShowOnMap={focusRecentRun} />
                {homepage.recentRuns && homepage.recentRuns.length > 0 && (
                  <RecentRunsCompact runs={homepage.recentRuns} onSelect={focusRecentRun} />
                )}
                {runSuggestionItems.length > 0 && (
                  <RunSuggestionsScroll
                    items={runSuggestionItems}
                    onFocusSuggestion={focusSuggestion}
                    onFocusStreet={focusStreetByOsmId}
                    onViewArea={focusClusterArea}
                  />
                )}
                <Link to="/projects/new" className={ctaGradientClass}>
                  Start tracking your streets
                </Link>
              </>
            )}

            {homepage?.userState === "active" && (
              <>
                <LastRunCard homepage={homepage} onShowOnMap={focusRecentRun} />
                {runSuggestionItems.length > 0 && (
                  <RunSuggestionsScroll
                    items={runSuggestionItems}
                    onFocusSuggestion={focusSuggestion}
                    onFocusStreet={focusStreetByOsmId}
                    onViewArea={focusClusterArea}
                  />
                )}
              </>
            )}

            {/* Stats row — active only */}
            {homepage?.userState === "active" && streets.length > 0 && (
              <div className={PANEL_CARD}>
                <PanelSectionHeading>Map filter</PanelSectionHeading>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-card-bg px-3 py-1.5 text-xs font-medium shadow-sm transition-opacity hover:opacity-90"
                    onClick={() => setVisibleBins(new Set(["completed"]))}
                  >
                    <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden />
                    {binCounts.completed} done
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-card-bg px-3 py-1.5 text-xs font-medium shadow-sm transition-opacity hover:opacity-90"
                    onClick={() => setVisibleBins(new Set(["almostThere"]))}
                  >
                    <span className="size-2 shrink-0 rounded-full bg-amber-500" aria-hidden />
                    {binCounts.almostThere} almost
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-card-bg px-3 py-1.5 text-xs font-medium shadow-sm transition-opacity hover:opacity-90"
                    onClick={() => setVisibleBins(new Set(["inProgress"]))}
                  >
                    <span className="size-2 shrink-0 rounded-full bg-cyan-500" aria-hidden />
                    {binCounts.inProgress} in progress
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-card-bg px-3 py-1.5 text-xs font-medium shadow-sm transition-opacity hover:opacity-90"
                    onClick={() => setVisibleBins(new Set(["notStarted"]))}
                  >
                    <span className="size-2 shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-500" aria-hidden />
                    {binCounts.notStarted} to go
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-card-bg px-3 py-1.5 text-xs font-medium shadow-sm transition-opacity hover:opacity-90"
                    onClick={() => setVisibleBins(new Set(ALL_BINS))}
                  >
                    All
                  </button>
                </div>
                {homepage.totalActivities != null && (
                  <p className="mt-2 text-xs text-text-muted">
                    {homepage.totalActivities} runs logged
                    {homepage.totalDistanceKm != null ? ` · ${homepage.totalDistanceKm} km total` : ""}
                  </p>
                )}
              </div>
            )}

            {/* Project processing notice */}
            {homepage?.userState === "project_processing" && (
              <div className={PANEL_CARD}>
                <p className="text-sm text-text-muted">Processing your project…</p>
              </div>
            )}

            {/* Empty brand_new */}
            {homepage &&
              homepage.userState === "brand_new" &&
              !homepage.primarySuggestion &&
              !homepage.firstStreet &&
              streets.length === 0 && (
                <div className={PANEL_CARD}>
                  <p className="text-center text-sm text-text-muted">
                    Connect Strava to see your streets on the map.
                  </p>
                </div>
              )}
          </div>
        )}
      </aside>
    </div>
  );
}
