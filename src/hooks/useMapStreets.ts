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
    if (lat == null || lng == null) {
      console.log(`[useMapStreets] fetchStreets skipped - no lat/lng`, { lat, lng });
      return undefined;
    }

    const key = cacheKey(lat, lng, radius);
    const cached = getCached(key);
    if (cached) {
      console.log(`[useMapStreets] Returning cached streets data`, { key, lat, lng, radius });
      setData(cached);
      setError(null);
      return undefined;
    }

    console.log(`[useMapStreets] Fetching streets at ${new Date().toISOString()}`, {
      lat,
      lng,
      radius,
      cacheKey: key,
    });

    let cancelled = false;
    setError(null);
    setIsLoading(true);

    mapService
      .getStreets(lat, lng, radius)
      .then((res) => {
        if (!cancelled) {
          console.log(`[useMapStreets] Streets received successfully`, {
            streetCount: res.streets?.length ?? 0,
            cacheKey: key,
          });
          setData(res);
          setCached(key, res);
        } else {
          console.log(`[useMapStreets] Request cancelled after completion`);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(`[useMapStreets] Error fetching streets:`, err);
          setError(err?.message ?? "Failed to load streets.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      console.log(`[useMapStreets] Cleanup - cancelling request`);
      cancelled = true;
    };
  }, [lat, lng, radius]);

  useEffect(() => {
    console.log(`[useMapStreets] useEffect triggered`, { lat, lng, radius });
    const cleanup = fetchStreets();
    return () => {
      console.log(`[useMapStreets] useEffect cleanup`);
      cleanup?.();
    };
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
