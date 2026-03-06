/**
 * Fetches homepage payload (hero, streak, suggestion, milestone, mapContext).
 * Cache 30–60s; refetch invalidates cache.
 */
import { useState, useEffect, useCallback } from "react";
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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use initial user position for firstStreet, but current map center for other data
      const payload = await getHomepageData({
        ...params,
        userLat: initialUserLat,
        userLng: initialUserLng,
      });
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load homepage"));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.lat, params.lng, params.radius, params.projectId, initialUserLat, initialUserLng]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    invalidateHomepageCache();
    return fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
