/**
 * useMapStreets Hook
 * Fetches GET /map/streets for the given lat/lng. Uses in-memory cache by (center, radius)
 * so panning back to an area reuses data. Returns data, loading state, error, and refetch.
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

export function useMapStreets(
  lat: number | null,
  lng: number | null,
  radiusMeters?: number
): UseMapStreetsResult {
  const radius = radiusMeters ?? 1000;
  const [data, setData] = useState<MapStreetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchStreets = useCallback(() => {
    if (lat == null || lng == null) return undefined;

    const key = cacheKey(lat, lng, radius);
    const cached = getCached(key);
    if (cached) {
      setData(cached);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setError(null);
    setIsLoading(true);

    mapService
      .getStreets(lat, lng, radius)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setCached(key, res);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load streets.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, radius]);

  useEffect(() => {
    const cleanup = fetchStreets();
    return () => {
      cleanup?.();
    };
  }, [fetchStreets]);

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
