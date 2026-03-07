/**
 * Fetches homepage payload (hero, streak, suggestion, milestone, mapContext).
 * Cache 30–60s; refetch invalidates cache.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getHomepageData,
  invalidateHomepageCache,
  type HomepagePayload,
} from "../services/homepage.service";

interface UseHomepageDataParams {
  lat?: number;
  lng?: number;
  radius?: number;
  projectId?: string;
  userLat?: number;
  userLng?: number;
}

export function useHomepageData(params: UseHomepageDataParams) {
  const [data, setData] = useState<HomepagePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialUserLat, setInitialUserLat] = useState<number | undefined>(params.userLat);
  const [initialUserLng, setInitialUserLng] = useState<number | undefined>(params.userLng);

  // Only update initial user position once (for firstStreet calculation)
  // Don't update on every geolocation change to avoid constant re-renders
  useEffect(() => {
    if (params.userLat != null && params.userLng != null && 
        (initialUserLat == null || initialUserLng == null)) {
      setInitialUserLat(params.userLat);
      setInitialUserLng(params.userLng);
    }
  }, [params.userLat, params.userLng, initialUserLat, initialUserLng]);

  // Memoize params to prevent unnecessary re-fetches
  const memoizedParams = useMemo(
    () => ({
      lat: params.lat,
      lng: params.lng,
      radius: params.radius,
      projectId: params.projectId,
      userLat: initialUserLat,
      userLng: initialUserLng,
    }),
    [params.lat, params.lng, params.radius, params.projectId, initialUserLat, initialUserLng]
  );

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await getHomepageData(memoizedParams);
      if (signal?.aborted) return;
      setData(payload);
    } catch (e) {
      if (signal?.aborted) return;
      setError(e instanceof Error ? e : new Error("Failed to load homepage"));
      setData(null);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const refetch = useCallback(() => {
    invalidateHomepageCache();
    return fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
