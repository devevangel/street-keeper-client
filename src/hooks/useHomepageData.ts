/**
 * Fetches homepage payload (suggestion, milestone, mapContext).
 * Cache 30–60s; refetch invalidates cache.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

  // Capture initial user position once to avoid re-fetching on every geolocation update
  const initialUserPosRef = useRef<{ lat: number; lng: number } | null>(null);
  if (
    !initialUserPosRef.current &&
    params.userLat != null &&
    params.userLng != null
  ) {
    initialUserPosRef.current = { lat: params.userLat, lng: params.userLng };
  }

  const hasLocation = params.lat != null && params.lng != null;

  // Stable params key — only changes when meaningful inputs change
  const paramsKey = useMemo(
    () =>
      hasLocation
        ? JSON.stringify({
            lat: params.lat,
            lng: params.lng,
            radius: params.radius,
            projectId: params.projectId,
            userLat: initialUserPosRef.current?.lat,
            userLng: initialUserPosRef.current?.lng,
          })
        : "",
    [hasLocation, params.lat, params.lng, params.radius, params.projectId],
  );

  const prevKeyRef = useRef("");

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      if (!hasLocation) return;
      setIsLoading(true);
      setError(null);
      try {
        const payload = await getHomepageData({
          lat: params.lat,
          lng: params.lng,
          radius: params.radius,
          projectId: params.projectId,
          userLat: initialUserPosRef.current?.lat,
          userLng: initialUserPosRef.current?.lng,
        });
        if (!signal?.aborted) setData(payload);
      } catch (e) {
        if (!signal?.aborted) {
          setError(e instanceof Error ? e : new Error("Failed to load homepage"));
          setData(null);
        }
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [hasLocation, params.lat, params.lng, params.radius, params.projectId],
  );

  useEffect(() => {
    if (!paramsKey || prevKeyRef.current === paramsKey) return;
    prevKeyRef.current = paramsKey;

    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [paramsKey, fetchData]);

  const refetch = useCallback(() => {
    invalidateHomepageCache();
    prevKeyRef.current = "";
    return fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
