/**
 * useMapStreets Hook
 * Fetches GET /map/streets for the given lat/lng. Runs when lat and lng are set.
 * Returns data, loading state, error, and refetch function.
 */

import { useCallback, useEffect, useState } from "react";
import { mapService } from "../services/map.service";
import type { MapStreetsResponse } from "../types/api.types";

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
  const [data, setData] = useState<MapStreetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStreets = useCallback(() => {
    if (lat == null || lng == null) return undefined;

    let cancelled = false;
    setError(null);
    setIsLoading(true);

    mapService
      .getStreets(lat, lng, radiusMeters)
      .then((res) => {
        if (!cancelled) setData(res);
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
  }, [lat, lng, radiusMeters]);

  useEffect(() => {
    const cleanup = fetchStreets();
    return () => {
      cleanup?.();
    };
  }, [fetchStreets]);

  const refetch = useCallback(() => {
    fetchStreets();
  }, [fetchStreets]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
