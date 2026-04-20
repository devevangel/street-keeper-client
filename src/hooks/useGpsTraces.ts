/**
 * useGpsTraces Hook
 * Fetches GET /map/traces (area) or GET /projects/:id/traces (project).
 * Uses in-memory LRU cache to avoid redundant fetches.
 * Aborts in-flight requests on unmount or when params change.
 */

import { useCallback, useEffect, useState } from "react";
import { mapService } from "../services/map.service";
import type { GpsTrace, GpsTracesResponse } from "../types/api.types";

const CACHE_MAX_ENTRIES = 50;

function areaCacheKey(lat: number, lng: number, radius: number): string {
  return `traces_${Math.round(lat * 1000) / 1000}_${Math.round(lng * 1000) / 1000}_${radius}`;
}

function projectCacheKey(projectId: string): string {
  return `traces_project_${projectId}`;
}

const cache = new Map<string, GpsTracesResponse>();
const cacheOrder: string[] = [];

function getCached(key: string): GpsTracesResponse | undefined {
  return cache.get(key);
}

function setCached(key: string, value: GpsTracesResponse): void {
  if (cache.has(key)) {
    cacheOrder.splice(cacheOrder.indexOf(key), 1);
  } else if (cacheOrder.length >= CACHE_MAX_ENTRIES) {
    const oldest = cacheOrder.shift();
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, value);
  cacheOrder.push(key);
}

export interface UseGpsTracesResult {
  traces: GpsTrace[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseGpsTracesAreaParams {
  lat: number | null;
  lng: number | null;
  radius?: number;
}

export interface UseGpsTracesProjectParams {
  projectId: string | null;
}

export type UseGpsTracesParams = UseGpsTracesAreaParams | UseGpsTracesProjectParams;

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export function useGpsTraces(
  params: UseGpsTracesParams
): UseGpsTracesResult {
  const [data, setData] = useState<GpsTracesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectId =
    "projectId" in params && params.projectId != null ? params.projectId : null;
  const lat =
    "lat" in params ? (params.lat ?? null) : null;
  const lng =
    "lng" in params ? (params.lng ?? null) : null;
  const radius =
    "radius" in params && params.radius != null ? params.radius : 5000;

  const fetchTraces = useCallback(() => {
    if (projectId) {
      const key = projectCacheKey(projectId);
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
        .getProjectTraces(projectId, controller.signal)
        .then((res) => {
          if (!controller.signal.aborted) {
            setData(res);
            setCached(key, res);
          }
        })
        .catch((err) => {
          if (controller.signal.aborted || isAbortError(err)) return;
          setError(err?.message ?? "Failed to load traces.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
      return () => controller.abort();
    }

    if (lat == null || lng == null) {
      setData(null);
      setError(null);
      return undefined;
    }
    const key = areaCacheKey(lat, lng, radius);
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
      .getTraces(lat, lng, radius, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res);
          setCached(key, res);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        setError(err?.message ?? "Failed to load traces.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [projectId, lat, lng, radius]);

  useEffect(() => {
    const cleanup = fetchTraces();
    return () => cleanup?.();
  }, [fetchTraces]);

  const refetch = useCallback(() => {
    if (projectId) {
      cache.delete(projectCacheKey(projectId));
    } else if (lat != null && lng != null) {
      cache.delete(areaCacheKey(lat, lng, radius));
    }
    fetchTraces();
  }, [fetchTraces, projectId, lat, lng, radius]);

  return {
    traces: data?.traces ?? [],
    isLoading,
    error,
    refetch,
  };
}
