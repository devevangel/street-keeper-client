/**
 * useMapStreets Hook
 * Fetches GET /map/streets for the given lat/lng. Uses in-memory cache by (center, radius)
 * so panning back to an area reuses data. Returns data, loading state, error, and refetch.
 * Aborts in-flight requests on unmount or when params change.
 */

import { useCallback, useEffect, useState } from "react";
import { mapService } from "../services/map.service";
import type { MapStreetsResponse } from "../types/api.types";

const CACHE_MAX_ENTRIES = 50;

function cacheKey(lat: number, lng: number, radius: number): string {
  return `${Math.round(lat * 1000) / 1000}_${Math.round(lng * 1000) / 1000}_${radius}`;
}

const cache = new Map<string, MapStreetsResponse>();
const cacheOrder: string[] = [];

function getCached(key: string): MapStreetsResponse | undefined {
  return cache.get(key);
}

function setCached(key: string, value: MapStreetsResponse): void {
  if (cache.has(key)) {
    cacheOrder.splice(cacheOrder.indexOf(key), 1);
  } else if (cacheOrder.length >= CACHE_MAX_ENTRIES) {
    const oldest = cacheOrder.shift();
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, value);
  cacheOrder.push(key);
}

export interface UseMapStreetsResult {
  /** Response from GET /map/streets or null */
  data: MapStreetsResponse | null;
  /** True while fetching */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Re-fetch with current lat/lng/radius */
  refetch: () => void;
}

function initialDataMatches(
  initialData: MapStreetsResponse,
  lat: number,
  lng: number,
  radius: number
): boolean {
  return (
    initialData.center.lat === lat &&
    initialData.center.lng === lng &&
    initialData.radiusMeters === radius
  );
}

function isAbortError(err: unknown): boolean {
  return (
    err instanceof DOMException && err.name === "AbortError"
  );
}

export function useMapStreets(
  lat: number | null,
  lng: number | null,
  radiusMeters?: number,
  /** When provided (e.g. from homepage mapSegments), seeds the cache and avoids a separate GET /map/streets call when key matches. */
  initialData?: MapStreetsResponse | null
): UseMapStreetsResult {
  const radius = radiusMeters ?? 1000;
  const [data, setData] = useState<MapStreetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStreets = useCallback(() => {
    if (lat == null || lng == null) {
      return undefined;
    }

    const key = cacheKey(lat, lng, radius);

    if (
      initialData &&
      initialDataMatches(initialData, lat, lng, radius)
    ) {
      setCached(key, initialData);
      setData(initialData);
      setError(null);
      return undefined;
    }

    const cached = getCached(key);
    if (cached) {
      setData(cached);
      setError(null);
      return undefined;
    }

    const controller = new AbortController();
    setError(null);
    setIsLoading(true);

    mapService
      .getStreets(lat, lng, radius, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res);
          setCached(key, res);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        setError(err?.message ?? "Failed to load streets.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [lat, lng, radius, initialData]);

  useEffect(() => {
    const cleanup = fetchStreets();
    return () => cleanup?.();
  }, [fetchStreets, lat, lng, radius]);

  const refetch = useCallback(() => {
    if (lat != null && lng != null) {
      cache.delete(cacheKey(lat, lng, radius));
    }
    fetchStreets();
  }, [fetchStreets, lat, lng, radius]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
