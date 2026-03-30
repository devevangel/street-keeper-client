/**
 * Polls GET /activities/sync/status every 3s while a sync is active (queued or running).
 * Backs off to 10s when sync appears stuck (queued with no progress for 90s).
 * Stops when status is completed or failed. Exposes transition (e.g. running -> completed) for map refetch.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { activitiesService } from "../services/activities.service";
import type { SyncStatusResponse } from "../services/activities.service";

const POLL_INTERVAL_MS = 3000;
const POLL_INTERVAL_STUCK_MS = 10000;
/** Match backend QUEUED_STALE_MS (2 min) so Retry triggers new job */
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
  /** True when status is queued or running */
  isActive: boolean;
  /** True when status just transitioned from running to completed (for triggering map refetch) */
  didComplete: boolean;
  /** True when queued with 0 processed for >90s (worker never picked up) — show Retry */
  appearsStuck: boolean;
  refetch: () => Promise<void>;
}

export function useSyncStatus(): UseSyncStatusResult {
  const [data, setData] = useState<SyncStatusResponse | null>(null);
  const prevStatusRef = useRef<SyncStatusResponse["status"] | null>(null);
  const [didComplete, setDidComplete] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await activitiesService.getSyncStatus();
      setData(res);

      const prev = prevStatusRef.current;
      prevStatusRef.current = res.status;
      if (prev === "running" && res.status === "completed") {
        setDidComplete(true);
      }
    } catch {
      // Auth failures (401) or network errors — treat as idle, stop polling
      setData(null);
    }
  }, []);

  useEffect(() => {
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
    if (!isActive) return;

    const intervalMs = appearsStuck ? POLL_INTERVAL_STUCK_MS : POLL_INTERVAL_MS;
    const interval = setInterval(() => {
      void fetchStatus();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [data?.status, data?.processed, data?.updatedAt, fetchStatus, isActive, appearsStuck]);

  // Reset didComplete after consumption (e.g. after parent triggers refetch)
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
    isActive,
    didComplete,
    appearsStuck,
    refetch: fetchStatus,
  };
}
