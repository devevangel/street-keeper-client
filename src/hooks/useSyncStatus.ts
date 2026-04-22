/**
 * Polls GET /activities/sync/status every 3s while a sync is active (queued or running).
 * Backs off to 10s when sync appears stuck (queued with no progress for 90s).
 * Stops when status is completed or failed.
 *
 * Waits for auth before making any requests. Does one initial check once
 * authenticated; enters the polling loop only if an active sync is found.
 * Call startPolling() after triggering a new sync.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { activitiesService } from "../services/activities.service";
import type { SyncStatusResponse } from "../services/activities.service";

const POLL_INTERVAL_MS = 3000;
const POLL_INTERVAL_STUCK_MS = 10000;
const STUCK_THRESHOLD_MS = 2 * 60 * 1000;

export interface UseSyncStatusResult {
  status: SyncStatusResponse["status"];
  syncId: string | null;
  total: number;
  processed: number;
  skipped: number;
  errors: number;
  lastErrorMessage: string | null;
  updatedAt: string | null;
  /** ISO time of last completed sync job (may be null if never completed). */
  lastCompletedAt: string | null;
  latestStoredActivityStartDate: string | null;
  latestStoredActivityName: string | null;
  isActive: boolean;
  didComplete: boolean;
  appearsStuck: boolean;
  startPolling: () => void;
  refetch: () => Promise<void>;
}

export function useSyncStatus(): UseSyncStatusResult {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<SyncStatusResponse | null>(null);
  const [polling, setPolling] = useState(false);
  const prevStatusRef = useRef<SyncStatusResponse["status"] | null>(null);
  const [didComplete, setDidComplete] = useState(false);
  const mountedRef = useRef(true);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await activitiesService.getSyncStatus();
      if (!mountedRef.current) return;
      setData(res);

      const prev = prevStatusRef.current;
      prevStatusRef.current = res.status;
      if (prev === "running" && res.status === "completed") {
        setDidComplete(true);
      }
      if (res.status === "queued" || res.status === "running") {
        setPolling(true);
      }
    } catch {
      if (mountedRef.current) setData(null);
    }
  }, []);

  // One check once auth is ready to pick up any in-progress sync
  useEffect(() => {
    if (!isAuthenticated || initialCheckDone.current) return;
    initialCheckDone.current = true;
    void fetchStatus();
  }, [isAuthenticated, fetchStatus]);

  // Refresh when the user returns to the tab (catch completed jobs while away)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        void fetchStatus();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isAuthenticated, fetchStatus]);

  const startPolling = useCallback(() => {
    setPolling(true);
    void fetchStatus();
  }, [fetchStatus]);

  const status = data?.status ?? "idle";
  const isActive = status === "queued" || status === "running";
  const updatedAtMs = data?.updatedAt ? new Date(data.updatedAt).getTime() : 0;
  const appearsStuck =
    status === "queued" &&
    (data?.processed ?? 0) === 0 &&
    updatedAtMs > 0 &&
    Date.now() - updatedAtMs > STUCK_THRESHOLD_MS;

  useEffect(() => {
    if (!polling || !isActive) return;
    const intervalMs = appearsStuck ? POLL_INTERVAL_STUCK_MS : POLL_INTERVAL_MS;
    const interval = setInterval(() => void fetchStatus(), intervalMs);
    return () => clearInterval(interval);
  }, [polling, isActive, appearsStuck, fetchStatus]);

  useEffect(() => {
    if (polling && !isActive && data != null) {
      setPolling(false);
    }
  }, [polling, isActive, data]);

  useEffect(() => {
    if (!didComplete) return;
    const t = setTimeout(() => setDidComplete(false), 100);
    return () => clearTimeout(t);
  }, [didComplete]);

  return {
    status,
    syncId: data?.syncId ?? null,
    total: data?.total ?? 0,
    processed: data?.processed ?? 0,
    skipped: data?.skipped ?? 0,
    errors: data?.errors ?? 0,
    lastErrorMessage: data?.lastErrorMessage ?? null,
    updatedAt: data?.updatedAt ?? null,
    lastCompletedAt: data?.lastCompletedAt ?? null,
    latestStoredActivityStartDate: data?.latestStoredActivityStartDate ?? null,
    latestStoredActivityName: data?.latestStoredActivityName ?? null,
    isActive,
    didComplete,
    appearsStuck,
    startPolling,
    refetch: fetchStatus,
  };
}
