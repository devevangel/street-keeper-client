/**
 * HomePage
 * Map view: user location or search result, streets with progress, hero stats, and top streets.
 * Accumulates segments on pan (GTA-style); only fetches when center moves > MIN_FETCH_DISTANCE_M.
 */

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "../components/common";
import {
  LocationPrompt,
  MapStats,
  MapView,
} from "../components/map";
import { UniversalSearchInput } from "../components/projects/UniversalSearchInput";
import { useGeolocation, useMapStreets } from "../hooks";
import { activitiesService } from "../services/activities.service";
import type { GeocodingResult, MapStreet } from "../types/api.types";

const DEFAULT_RADIUS = 1000;
const TOP_STREETS_COUNT = 5;
const MIN_FETCH_DISTANCE_M = 200;

/** Approximate distance in meters between two WGS84 points (Haversine). */
function haversineDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth radius in m
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

  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  /** Center used for API fetch; only updated when mapCenter moves > MIN_FETCH_DISTANCE_M or on search/location. */
  const [fetchCenter, setFetchCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  /** Accumulated segments (GTA-style); keyed by osmId. */
  const [allSegments, setAllSegments] = useState<Map<string, MapStreet>>(
    new Map()
  );

  useEffect(() => {
    if (position) {
      const pos = { lat: position.lat, lng: position.lng };
      setMapCenter((prev) => (prev === null ? pos : prev));
      setFetchCenter((prev) => (prev === null ? pos : prev));
    }
  }, [position?.lat, position?.lng]);

  const {
    data,
    isLoading: fetchLoading,
    error: fetchError,
    refetch,
  } = useMapStreets(
    fetchCenter?.lat ?? null,
    fetchCenter?.lng ?? null,
    DEFAULT_RADIUS
  );

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
      setMapCenter(center);
      setFetchCenter((prev) => {
        if (!prev) return center;
        if (haversineDistance(prev, center) > MIN_FETCH_DISTANCE_M) return center;
        return prev;
      });
    },
    []
  );

  const handleSearchSelect = useCallback((result: GeocodingResult) => {
    const center = { lat: result.lat, lng: result.lng };
    setMapCenter(center);
    setFetchCenter(center);
  }, []);

  const handleUseMyLocation = useCallback(() => {
    if (position) {
      const center = { lat: position.lat, lng: position.lng };
      setMapCenter(center);
      setFetchCenter(center);
    } else {
      requestPermission();
    }
  }, [position, requestPermission]);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    synced: number;
    error?: string;
  } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await activitiesService.syncFromStrava();
      setSyncResult({
        synced: result.synced + result.processed,
      });
      refetch();
    } catch (err) {
      setSyncResult({
        synced: 0,
        error: err instanceof Error ? err.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
    }
  };

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
        <p className="text-sm text-text-muted">
          Or search for an area below to see streets you&apos;ve run there.
        </p>
        <UniversalSearchInput
          placeholder="Search area: city, address, place…"
          onSelect={handleSearchSelect}
        />
      </div>
    );
  }

  if (fetchLoading && !data) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[200px] flex-1">
            <UniversalSearchInput
              placeholder="Search area: city, address, place…"
              onSelect={handleSearchSelect}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={handleUseMyLocation}>
            Use my location
          </Button>
        </div>
        <div className="py-8" role="status" aria-label="Loading streets">
          <p className="text-text-muted">Loading streets…</p>
        </div>
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

  const segmentsForView = data?.segments ?? [];
  const streets = data?.streets ?? [];
  const accumulatedSegments = Array.from(allSegments.values());
  const totalLengthMeters = segmentsForView.reduce(
    (sum, s) => sum + s.lengthMeters,
    0
  );
  const topStreets = streets
    .slice()
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, TOP_STREETS_COUNT);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[200px] flex-1">
          <UniversalSearchInput
            placeholder="Search area: city, address, place…"
            onSelect={handleSearchSelect}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleUseMyLocation}
          className="shrink-0"
        >
          Use my location
        </Button>
      </div>
      <MapView
        mapCenter={mapCenter}
        userLocation={position}
        streets={accumulatedSegments}
        onViewportChange={handleViewportChange}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? "Syncing..." : "Sync from Strava"}
        </Button>
        {syncResult && (
          <span
            className={
              syncResult.error
                ? "text-red-500"
                : "text-green-600 dark:text-green-400"
            }
          >
            {syncResult.error ??
              (syncResult.synced > 0
                ? `Synced ${syncResult.synced} activit${
                    syncResult.synced !== 1 ? "ies" : "y"
                  }`
                : "No new activities to sync")}
          </span>
        )}
      </div>
      <MapStats
        totalStreets={data?.totalStreets ?? 0}
        completedCount={data?.completedCount ?? 0}
        partialCount={data?.partialCount ?? 0}
        totalLengthMeters={totalLengthMeters}
      />

      {streets.length === 0 ? (
        <Card className="border-primary/30 bg-primary/5">
          <p className="mb-2 text-text">
            {!mapCenter
              ? "Search an area or use your location to see streets you've run."
              : "No streets with progress in this area yet."}
          </p>
          <p className="text-sm text-text-muted">
            {!mapCenter
              ? "Choose a place above or click \"Use my location\"."
              : "Sync from Strava to import your runs, or search another area."}
          </p>
        </Card>
      ) : (
        <section aria-label="Top streets in this area">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Top streets in this area
          </h2>
          <ul className="list-none space-y-1 rounded border-2 border-border bg-surface p-2">
            {topStreets.map((street) => (
              <li
                key={street.osmId}
                className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm"
              >
                <span className="font-medium text-text">
                  {street.name || "Unnamed"}
                </span>
                <span className="text-text-muted">
                  {street.percentage}% ·{" "}
                  {street.status === "completed" ? (
                    <span className="text-success">Completed</span>
                  ) : (
                    <span className="text-warning">In progress</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {streets.length > TOP_STREETS_COUNT && (
            <p className="mt-1 text-sm text-text-muted">
              and {streets.length - TOP_STREETS_COUNT} more in this area
            </p>
          )}
        </section>
      )}
    </div>
  );
}
