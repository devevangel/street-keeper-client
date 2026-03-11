/**
 * Fetches homepage payload (hero, streak, suggestion, milestone, mapContext).
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
  const [initialUserLat, setInitialUserLat] = useState<number | undefined>(params.userLat);
  const [initialUserLng, setInitialUserLng] = useState<number | undefined>(params.userLng);
  
  // Track if initial user position has been set to prevent duplicate fetches
  const initialUserPositionSetRef = useRef(false);
  // Track params key to prevent duplicate fetches when params haven't actually changed
  const paramsKeyRef = useRef<string>("");

  // Only update initial user position once (for firstStreet calculation)
  // Don't update on every geolocation change to avoid constant re-renders
  useEffect(() => {
    if (params.userLat != null && params.userLng != null && 
        !initialUserPositionSetRef.current) {
      initialUserPositionSetRef.current = true;
      setInitialUserLat(params.userLat);
      setInitialUserLng(params.userLng);
    }
  }, [params.userLat, params.userLng]);

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

  // Create a stable key for params to detect actual changes
  const currentParamsKey = useMemo(
    () => JSON.stringify(memoizedParams),
    [memoizedParams]
  );

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    console.log(`[useHomepageData] fetchData called at ${new Date().toISOString()}`, {
      params: memoizedParams,
      paramsKey: currentParamsKey,
      previousParamsKey: paramsKeyRef.current,
    });
    setIsLoading(true);
    setError(null);
    try {
      const payload = await getHomepageData(memoizedParams);
      if (signal?.aborted) {
        console.log(`[useHomepageData] Request aborted`);
        return;
      }
      console.log(`[useHomepageData] Data received successfully`);
      setData(payload);
    } catch (e) {
      if (signal?.aborted) {
        console.log(`[useHomepageData] Request aborted during error`);
        return;
      }
      console.error(`[useHomepageData] Error:`, e);
      setError(e instanceof Error ? e : new Error("Failed to load homepage"));
      setData(null);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [memoizedParams, currentParamsKey]);

  useEffect(() => {
    // Only fetch if params actually changed
    if (paramsKeyRef.current === currentParamsKey) {
      console.log(`[useHomepageData] useEffect skipped - params unchanged`, {
        currentParamsKey,
        previousParamsKey: paramsKeyRef.current,
      });
      return;
    }
    console.log(`[useHomepageData] useEffect triggering fetch`, {
      previousParamsKey: paramsKeyRef.current,
      newParamsKey: currentParamsKey,
      params: memoizedParams,
    });
    paramsKeyRef.current = currentParamsKey;
    
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => {
      console.log(`[useHomepageData] useEffect cleanup - aborting request`);
      controller.abort();
    };
  }, [currentParamsKey, fetchData, memoizedParams]);

  const refetch = useCallback(() => {
    invalidateHomepageCache();
    paramsKeyRef.current = ""; // Reset to force refetch
    return fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
