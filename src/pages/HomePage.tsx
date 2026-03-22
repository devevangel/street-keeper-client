/**
 * HomePage
 * Unified homepage layout: map, search, sync, suggestions, and project cards.
 * Handles geolocation, map street fetching, and delegates to ReturningUserHomepage when data is ready.
 * Shows shell immediately; location issues use inline banner. EmptyState when street fetch fails.
 *
 * @example
 * <Route path="/" element={<HomePage />} />
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState, SyncBanner } from "../components/common";
import { activitiesService } from "../services/activities.service";
import { ReturningUserHomepage } from "../components/homepage";
import { useAnalytics } from "../contexts/AnalyticsContext";
import { useToast } from "../contexts/ToastContext";
import { useGeolocation, useHomepageData, useMapStreets, useGpsTraces, useSyncStatus } from "../hooks";
import { ERROR_CODES } from "../config/constants";
import { ApiError } from "../lib/api-client";
import type { HomepagePayload } from "../services/homepage.service";
import type { MapStreet, MapStreetsResponse } from "../types/api.types";
import type { GeocodingResult } from "../types/api.types";

const DEFAULT_RADIUS = 1000;
const MIN_FETCH_DISTANCE_M = 200;
const VIEWPORT_DEBOUNCE_MS = 800;

const EMPTY_HOMEPAGE: HomepagePayload = {
  hero: { message: "", stateKey: "loading" },
  streak: { currentWeeks: 0, isAtRisk: false, lastRunDate: null, longestStreak: 0, qualifyingRunsThisWeek: 0 },
  primarySuggestion: null,
  alternates: [],
  nextMilestone: null,
  mapContext: { lat: 0, lng: 0, radius: DEFAULT_RADIUS },
  isNewUser: false,
};

function haversineDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function HomePage() {
  const {
    position,
    error: locationError,
    requestPermission,
  } = useGeolocation({ watch: true });
  const { track } = useAnalytics();

  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [fetchCenter, setFetchCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [allSegments, setAllSegments] = useState<Map<string, MapStreet>>(
    new Map(),
  );

  // Memoize homepage params to prevent unnecessary re-fetches when object reference changes
  const homepageParams = useMemo(
    () => ({
      lat: mapCenter?.lat,
      lng: mapCenter?.lng,
      userLat: position?.lat,
      userLng: position?.lng,
      radius: DEFAULT_RADIUS,
    }),
    [mapCenter?.lat, mapCenter?.lng, position?.lat, position?.lng]
  );
  const {
    data: homepage,
    isLoading: homepageLoading,
    refetch: refetchHomepage,
  } = useHomepageData(homepageParams);

  // Build initial map data from inlined homepage segments to avoid a second GET /map/streets on first load
  const mapStreetsInitialData = useMemo((): MapStreetsResponse | null => {
    if (
      !homepage?.mapSegments?.length ||
      !homepage?.mapContext ||
      (homepage.mapContext.lat === 0 && homepage.mapContext.lng === 0)
    ) {
      return null;
    }
    const segments = homepage.mapSegments;
    return {
      success: true,
      streets: segments,
      segments,
      center: { lat: homepage.mapContext.lat, lng: homepage.mapContext.lng },
      radiusMeters: homepage.mapContext.radius,
      totalStreets: segments.length,
      completedCount: segments.filter((s) => s.status === "completed").length,
      partialCount: segments.filter((s) => s.status === "partial").length,
    };
  }, [homepage?.mapSegments, homepage?.mapContext]);

  // Only update map center when position actually changes (not just object reference)
  const positionKey = position ? `${position.lat.toFixed(6)}_${position.lng.toFixed(6)}` : null;
  const prevPositionKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (position && positionKey !== prevPositionKeyRef.current) {
      prevPositionKeyRef.current = positionKey;
      const pos = { lat: position.lat, lng: position.lng };
      setMapCenter((prev) => (prev === null ? pos : prev));
      setFetchCenter((prev) => (prev === null ? pos : prev));
    }
  }, [position, positionKey]);

  const { data, error: fetchError, refetch: refetchMapStreets } = useMapStreets(
    fetchCenter?.lat ?? null,
    fetchCenter?.lng ?? null,
    DEFAULT_RADIUS,
    mapStreetsInitialData,
  );

  const { traces: gpsTraces, refetch: refetchTraces } = useGpsTraces({
    lat: fetchCenter?.lat ?? null,
    lng: fetchCenter?.lng ?? null,
    radius: DEFAULT_RADIUS,
  });

  const syncStatus = useSyncStatus();
  const toast = useToast();

  const handleSyncRetry = useCallback(async () => {
    try {
      await activitiesService.syncFromStrava({ background: true });
      await syncStatus.refetch();
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 429 &&
        err.code === ERROR_CODES.SYNC_RATE_LIMITED
      ) {
        const next = err.body?.nextSyncAt
          ? new Date(err.body.nextSyncAt).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            })
          : null;
        const msg = next
          ? `Strava can only be synced once per day. Next sync available at ${next}.`
          : err.message;
        toast?.showToast(msg, "warning");
      }
      await syncStatus.refetch();
    }
  }, [syncStatus, toast]);

  const clearSegments = useCallback(() => {
    setAllSegments(new Map());
  }, []);

  // Track homepage view only once when data changes, not on every render
  const homepageTrackedRef = useRef<string | null>(null);
  useEffect(() => {
    if (homepage) {
      const key = `${homepage.hero.stateKey}_${homepage.isNewUser}_${!!homepage.primarySuggestion}_${!!homepage.firstStreet}`;
      if (homepageTrackedRef.current !== key) {
        homepageTrackedRef.current = key;
        track("homepage_viewed", {
          stateKey: homepage.hero.stateKey,
          isNewUser: homepage.isNewUser,
          hasSuggestion: !!homepage.primarySuggestion,
          hasFirstStreet: !!homepage.firstStreet,
        });
      }
    }
  }, [homepage, track]);

  // Only update segments when segment IDs actually change, not just array reference
  const segmentIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!data?.segments.length) return;
    const currentIds = new Set(data.segments.map((s) => s.osmId));
    const idsChanged = currentIds.size !== segmentIdsRef.current.size ||
      [...currentIds].some((id) => !segmentIdsRef.current.has(id));
    if (idsChanged) {
      segmentIdsRef.current = currentIds;
      setAllSegments((prev) => {
        const merged = new Map(prev);
        for (const seg of data.segments) {
          if (!merged.has(seg.osmId)) merged.set(seg.osmId, seg);
        }
        return merged;
      });
    }
  }, [data?.segments]);

  const viewportDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleViewportChange = useCallback(
    (center: { lat: number; lng: number }) => {
      // Debounce + distance threshold to reduce Overpass API calls.
      // Only fetch new streets when user stops panning AND has moved past threshold.
      if (viewportDebounceRef.current) {
        clearTimeout(viewportDebounceRef.current);
      }
      viewportDebounceRef.current = setTimeout(() => {
        setFetchCenter((prev) => {
          if (!prev) return center;
          if (haversineDistance(prev, center) > MIN_FETCH_DISTANCE_M)
            return center;
          return prev;
        });
      }, VIEWPORT_DEBOUNCE_MS);
    },
    [],
  );

  const handleSearchSelect = useCallback((result: GeocodingResult) => {
    const center = { lat: result.lat, lng: result.lng };
    setMapCenter(center);
    setFetchCenter(center);
  }, []);

  const handleFocusLocation = useCallback(
    (center: { lat: number; lng: number }) => {
      setMapCenter(center);
      setFetchCenter(center);
    },
    []
  );


  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // If geolocation fails but we have homepage data with a valid mapContext
  // (from activity history or backend fallback), use that instead of blocking.
  useEffect(() => {
    if (locationError && !mapCenter && !position && homepage?.mapContext) {
      const { lat, lng } = homepage.mapContext;
      if (lat !== 0 || lng !== 0) {
        setMapCenter({ lat, lng });
        setFetchCenter({ lat, lng });
      }
    }
  }, [locationError, mapCenter, position, homepage?.mapContext]);

  // Refetch map streets when homepage data first arrives (homepage populates the
  // backend geometry cache via Overpass; the initial /map/streets call often races
  // and gets 0 results because it fires before the cache is warm).
  const homepageLoadedRef = useRef(false);
  useEffect(() => {
    if (homepage && !homepageLoadedRef.current) {
      homepageLoadedRef.current = true;
      refetchMapStreets();
    }
  }, [homepage, refetchMapStreets]);

  // Progressively refresh map and traces as sync processes activities (every 5 processed)
  const lastRefreshCountRef = useRef(0);
  useEffect(() => {
    if (!syncStatus.isActive) return;
    const processed = syncStatus.processed;
    if (
      processed > 0 &&
      processed !== lastRefreshCountRef.current &&
      (processed <= 2 || processed - lastRefreshCountRef.current >= 5)
    ) {
      lastRefreshCountRef.current = processed;
      refetchMapStreets();
      refetchTraces();
    }
  }, [syncStatus.isActive, syncStatus.processed, refetchMapStreets, refetchTraces]);

  // Final refresh when sync completes
  useEffect(() => {
    if (syncStatus.didComplete) {
      lastRefreshCountRef.current = 0;
      refetchMapStreets();
      refetchTraces();
      refetchHomepage();
    }
  }, [syncStatus.didComplete, refetchMapStreets, refetchTraces, refetchHomepage]);

  // --- All hooks are above this line. Conditional returns below. ---

  const hasMapFallback = Boolean(
    homepage?.mapContext &&
      (homepage.mapContext.lat !== 0 || homepage.mapContext.lng !== 0)
  );
  const showLocationAccessBanner =
    Boolean(locationError) &&
    !mapCenter &&
    !position &&
    !homepageLoading &&
    !hasMapFallback;

  if (fetchError) {
    return (
      <EmptyState
        title="Could not load streets"
        description={`${fetchError} Try again or move the map to refresh.`}
        action="Try again"
        onAction={refetchMapStreets}
      />
    );
  }

  const accumulatedSegments = Array.from(allSegments.values());

  return (
    <div className="flex h-full flex-col">
      {syncStatus.status !== "idle" && (
        <div className="shrink-0 px-3 py-2">
          <SyncBanner sync={syncStatus} onRetry={handleSyncRetry} />
        </div>
      )}
      <ReturningUserHomepage
        data={homepage ?? EMPTY_HOMEPAGE}
        isLoading={homepageLoading}
        userLocation={position}
        mapCenter={mapCenter}
        streets={accumulatedSegments}
        gpsTraces={gpsTraces}
        onViewportChange={handleViewportChange}
        onRefetch={refetchHomepage}
        onClearSegments={clearSegments}
        onRefetchMapStreets={refetchMapStreets}
        onSearchSelect={handleSearchSelect}
        onFocusLocation={handleFocusLocation}
        backgroundSyncActive={syncStatus.isActive}
        showLocationAccessBanner={showLocationAccessBanner}
        locationErrorMessage={locationError ?? undefined}
        onRetryLocation={requestPermission}
      />
    </div>
  );
}
