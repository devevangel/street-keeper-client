/**
 * HomePage
 * Decision engine: hero, one suggestion, chunked progress, map with highlight.
 * Fetches homepage payload (hero, streak, suggestion, milestone); map loads streets separately.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card } from "../components/common";
import {
  DynamicHero,
  ProgressRing,
  SuggestionCard,
  StreakBlock,
  TodaysHighlight,
} from "../components/homepage";
import {
  LocationPrompt,
  MapView,
  type MapViewHighlightFocus,
} from "../components/map";
import { UniversalSearchInput } from "../components/projects/UniversalSearchInput";
import { useAnalytics } from "../contexts/AnalyticsContext";
import { useGeolocation, useHomepageData, useMapStreets } from "../hooks";
import { activitiesService } from "../services/activities.service";
import { invalidateHomepageCache } from "../services/homepage.service";
import type { GeocodingResult, MapStreet } from "../types/api.types";

const DEFAULT_RADIUS = 1000;
const MIN_FETCH_DISTANCE_M = 200;

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
    isLoading: locationLoading,
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
  const [highlightFocus, setHighlightFocus] =
    useState<MapViewHighlightFocus | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const {
    data: homepage,
    isLoading: homepageLoading,
    refetch: refetchHomepage,
  } = useHomepageData({
    lat: mapCenter?.lat,
    lng: mapCenter?.lng,
    radius: DEFAULT_RADIUS,
  });

  useEffect(() => {
    if (position) {
      const pos = { lat: position.lat, lng: position.lng };
      setMapCenter((prev) => (prev === null ? pos : prev));
      setFetchCenter((prev) => (prev === null ? pos : prev));
    }
  }, [position?.lat, position?.lng]);

  const { data, error: fetchError, refetch } = useMapStreets(
    fetchCenter?.lat ?? null,
    fetchCenter?.lng ?? null,
    DEFAULT_RADIUS,
  );

  useEffect(() => {
    if (homepage) {
      track("homepage_viewed", {
        stateKey: homepage.hero.stateKey,
        hasSuggestion: !!homepage.primarySuggestion,
        hasStreak: homepage.streak.currentWeeks > 0,
      });
    }
  }, [
    homepage?.hero.stateKey,
    homepage?.primarySuggestion,
    homepage?.streak.currentWeeks,
    track,
  ]);

  useEffect(() => {
    if (!data?.segments.length) return;
    setAllSegments((prev) => {
      const merged = new Map(prev);
      for (const seg of data.segments) {
        if (!merged.has(seg.osmId)) merged.set(seg.osmId, seg);
      }
      return merged;
    });
  }, [data?.segments]);

  const handleViewportChange = useCallback(
    (center: { lat: number; lng: number }) => {
      // Only update fetchCenter when panning past threshold (for loading new streets).
      // Do not update mapCenter here — that would re-render the page and feed the
      // panned center back into MapView, causing MapCenterSync to run and the map to twitch.
      setFetchCenter((prev) => {
        if (!prev) return center;
        if (haversineDistance(prev, center) > MIN_FETCH_DISTANCE_M)
          return center;
        return prev;
      });
    },
    [],
  );

  const handleSearchSelect = useCallback((result: GeocodingResult) => {
    const center = { lat: result.lat, lng: result.lng };
    setMapCenter(center);
    setFetchCenter(center);
  }, []);

  const handleUseMyLocation = useCallback(() => {
    if (position) {
      setMapCenter({ lat: position.lat, lng: position.lng });
      setFetchCenter({ lat: position.lat, lng: position.lng });
    } else {
      requestPermission();
    }
  }, [position, requestPermission]);

  const handleShowOnMap = useCallback(() => {
    if (homepage?.primarySuggestion?.focus) {
      setHighlightFocus({
        bbox: homepage.primarySuggestion.focus.bbox,
        streetIds: homepage.primarySuggestion.focus.streetIds,
        startPoint: homepage.primarySuggestion.focus.startPoint,
      });
      mapRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [homepage?.primarySuggestion?.focus]);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    synced: number;
    error?: string;
  } | null>(null);

  const handleSync = useCallback(async () => {
    track("sync_clicked", {});
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await activitiesService.syncFromStrava();
      setSyncResult({ synced: result.synced + result.processed });
      invalidateHomepageCache();
      refetch();
      refetchHomepage();
    } catch (err) {
      setSyncResult({
        synced: 0,
        error: err instanceof Error ? err.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
    }
  }, [track, refetch, refetchHomepage]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  if (locationLoading && !position) {
    return (
      <LocationPrompt
        isLoading={locationLoading}
        error={locationError}
        onRetry={requestPermission}
      />
    );
  }

  if (locationError && !mapCenter && !position) {
    return (
      <div className="space-y-4">
        <LocationPrompt
          isLoading={false}
          error={locationError}
          onRetry={requestPermission}
        />
        <p className="text-sm text-text-muted">Or search for an area below.</p>
        <UniversalSearchInput
          placeholder="Search area…"
          onSelect={handleSearchSelect}
        />
      </div>
    );
  }

  if (fetchError) {
    return (
      <Card>
        <h2 className="mb-2 text-xl font-bold">Could not load streets</h2>
        <p className="text-text-muted" role="alert">
          {fetchError}
        </p>
      </Card>
    );
  }

  const accumulatedSegments = Array.from(allSegments.values());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[200px] flex-1">
          <UniversalSearchInput onSelect={handleSearchSelect} />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleUseMyLocation}
          className="h-8 min-h-8 shrink-0"
        >
          Use my location
        </Button>
      </div>

      <DynamicHero hero={homepage?.hero} isLoading={homepageLoading} />
      <SuggestionCard
        suggestion={homepage?.primarySuggestion}
        isLoading={homepageLoading}
        onShowOnMap={handleShowOnMap}
        onTrack={(action: "show_on_map" | "view_milestones") =>
            track("primary_action_clicked", { action })}
      />
      <ProgressRing
        milestone={homepage?.nextMilestone}
        isLoading={homepageLoading}
      />
      <TodaysHighlight
        highlights={homepage?.recentHighlights}
        lastRun={homepage?.lastRun}
      />

      <div ref={mapRef}>
        <MapView
          mapCenter={mapCenter}
          userLocation={position}
          streets={accumulatedSegments}
          onViewportChange={handleViewportChange}
          highlightFocus={highlightFocus}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? "Syncing…" : "Sync from Strava"}
        </Button>
        {syncResult && (
          <span className={syncResult.error ? "text-red-500" : "text-success"}>
            {syncResult.error ??
              (syncResult.synced > 0
                ? `Synced ${syncResult.synced} activit${syncResult.synced !== 1 ? "ies" : "y"}`
                : "No new activities")}
          </span>
        )}
      </div>
      <StreakBlock streak={homepage?.streak} />

      {!data?.streets?.length && (
        <p className="text-text-muted text-sm">
          {!mapCenter
            ? "Search an area or use your location."
            : "No streets with progress here yet. Sync from Strava."}
        </p>
      )}
    </div>
  );
}
