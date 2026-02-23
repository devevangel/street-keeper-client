/**
 * HomePage
 * Unified homepage layout: map, search, sync, suggestions, and project cards.
 * Handles geolocation, map street fetching, and delegates to ReturningUserHomepage when data is ready.
 * Shows LocationPrompt when location is needed and EmptyState when street fetch fails.
 *
 * @example
 * <Route path="/" element={<HomePage />} />
 */

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../components/common";
import { ReturningUserHomepage } from "../components/homepage";
import { LocationPrompt } from "../components/map";
import { useAnalytics } from "../contexts/AnalyticsContext";
import { useGeolocation, useHomepageData, useMapStreets } from "../hooks";
import type { MapStreet } from "../types/api.types";
import type { GeocodingResult } from "../types/api.types";

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

  const {
    data: homepage,
    isLoading: homepageLoading,
    refetch: refetchHomepage,
  } = useHomepageData({
    lat: mapCenter?.lat,
    lng: mapCenter?.lng,
    userLat: position?.lat,
    userLng: position?.lng,
    radius: DEFAULT_RADIUS,
  });

  useEffect(() => {
    if (position) {
      const pos = { lat: position.lat, lng: position.lng };
      setMapCenter((prev) => (prev === null ? pos : prev));
      setFetchCenter((prev) => (prev === null ? pos : prev));
    }
  }, [position?.lat, position?.lng]);

  const { data, error: fetchError, refetch: refetchMapStreets } = useMapStreets(
    fetchCenter?.lat ?? null,
    fetchCenter?.lng ?? null,
    DEFAULT_RADIUS,
  );

  const clearSegments = useCallback(() => {
    setAllSegments(new Map());
  }, []);

  useEffect(() => {
    if (homepage) {
      track("homepage_viewed", {
        stateKey: homepage.hero.stateKey,
        isNewUser: homepage.isNewUser,
        hasSuggestion: !!homepage.primarySuggestion,
        hasFirstStreet: !!homepage.firstStreet,
      });
    }
  }, [
    homepage?.hero.stateKey,
    homepage?.isNewUser,
    homepage?.primarySuggestion,
    homepage?.firstStreet,
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
      <LocationPrompt
        isLoading={false}
        error={locationError}
        onRetry={requestPermission}
      />
    );
  }

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

  if (!homepage) {
    return null;
  }

  return (
    <ReturningUserHomepage
      data={homepage}
      isLoading={homepageLoading}
      userLocation={position}
      mapCenter={mapCenter}
      streets={accumulatedSegments}
      onViewportChange={handleViewportChange}
      onRefetch={refetchHomepage}
      onClearSegments={clearSegments}
      onRefetchMapStreets={refetchMapStreets}
      onSearchSelect={handleSearchSelect}
      onFocusLocation={handleFocusLocation}
    />
  );
}
