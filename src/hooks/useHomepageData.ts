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
}

export function useHomepageData(params: UseHomepageDataParams) {
  const [data, setData] = useState<HomepagePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await getHomepageData(params);
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load homepage"));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.lat, params.lng, params.radius, params.projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    invalidateHomepageCache();
    return fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
