/**
 * Run celebration — fetches pending batch, re-fetches after sync completes,
 * handles share + acknowledge. Dev URL ?__celebration=demo|demoCompleted uses fixtures.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { ApiError } from "../../lib/api-client";
import type { UseSyncStatusResult } from "../../hooks/useSyncStatus";
import {
  celebrationsService,
  type PendingCelebrationBatch,
} from "../../services/celebrations.service";
import { RunCelebration } from "./RunCelebration";

/** Once per browser session per user id — initial pending fetch only (sync re-fetch is separate). */
let runCelebrationSessionFetched = false;
let runCelebrationSessionUserId: string | null = null;

function syncSessionUser(userId: string | null) {
  if (userId !== runCelebrationSessionUserId) {
    runCelebrationSessionUserId = userId;
    runCelebrationSessionFetched = false;
  }
}

export interface RunCelebrationControllerProps {
  syncStatus: UseSyncStatusResult;
}

export function RunCelebrationController({ syncStatus }: RunCelebrationControllerProps) {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [batch, setBatch] = useState<PendingCelebrationBatch | null>(null);
  const [shareState, setShareState] = useState<"idle" | "sharing" | "shared" | "error">("idle");
  const [shareError, setShareError] = useState<string | null>(null);
  const prevDevDemo = useRef(false);
  const batchKey = batch?.events.map((e) => e.id).join(",") ?? "";

  useEffect(() => {
    setShareState("idle");
    setShareError(null);
  }, [batchKey]);

  /** Query key and fixtures live only in dev builds (Vite drops this branch in production). */
  const celebrationParam = import.meta.env.DEV
    ? (() => {
        const raw = searchParams.get("__celebration");
        return raw === "demo" || raw === "demoCompleted" ? raw : null;
      })()
    : null;
  const isDevDemo = celebrationParam !== null;

  const loadPending = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await celebrationsService.getPending();
      if (res.hasPending && res.events.length > 0) {
        setBatch(res);
      } else {
        setBatch(null);
      }
    } catch (e) {
      console.warn("[RunCelebration] getPending failed:", e);
      setBatch(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    syncSessionUser(user?.id ?? null);
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setBatch(null);
      setShareState("idle");
      setShareError(null);
      return;
    }
    if (isDevDemo && celebrationParam) {
      prevDevDemo.current = true;
      let cancelled = false;
      void import("./fixtures").then(({ getDemoCelebrationFixture }) => {
        if (cancelled) return;
        setBatch(getDemoCelebrationFixture(celebrationParam));
      });
      setShareState("idle");
      setShareError(null);
      return () => {
        cancelled = true;
      };
    }
    if (prevDevDemo.current && !isDevDemo) {
      prevDevDemo.current = false;
      runCelebrationSessionFetched = true;
      void loadPending();
    }
  }, [isAuthenticated, isDevDemo, celebrationParam, loadPending]);

  useEffect(() => {
    if (!isAuthenticated || isDevDemo) return;
    if (!runCelebrationSessionFetched) {
      runCelebrationSessionFetched = true;
      void loadPending();
    }
  }, [isAuthenticated, isDevDemo, loadPending]);

  useEffect(() => {
    if (!syncStatus.didComplete || !isAuthenticated || isDevDemo) return;
    void loadPending();
  }, [syncStatus.didComplete, isAuthenticated, isDevDemo, loadPending]);

  const stripDemoQuery = useCallback(() => {
    if (!import.meta.env.DEV) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("__celebration");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleClose = useCallback(() => {
    const current = batch;
    if (!current?.events.length) {
      if (isDevDemo) stripDemoQuery();
      setBatch(null);
      setShareState("idle");
      setShareError(null);
      return;
    }
    const eventIds = current.events.map((e) => e.id);
    if (!isDevDemo) {
      void celebrationsService.acknowledge(eventIds).catch((err) => {
        console.warn("[RunCelebration] acknowledge on close failed:", err);
      });
    } else {
      stripDemoQuery();
    }
    setBatch(null);
    setShareState("idle");
    setShareError(null);
  }, [batch, isDevDemo, stripDemoQuery]);

  const handleShare = useCallback(async () => {
    if (!batch?.events.length) return;
    const eventIds = batch.events.map((e) => e.id);

    if (isDevDemo) {
      setShareError(
        "Preview mode — Strava share is not available. Close this screen or remove the demo URL param to use a real celebration.",
      );
      setShareState("error");
      return;
    }

    setShareError(null);
    setShareState("sharing");
    try {
      await celebrationsService.shareToStrava(eventIds);
      await celebrationsService.acknowledge(eventIds);
      toast?.showToast("Posted to your Strava activity.", "success");
      setBatch(null);
    } catch (e) {
      setShareState("error");
      if (e instanceof ApiError) {
        if (e.status === 401 || e.status === 403) {
          setShareError(
            `${e.message} Re-authorize Strava from Preferences if your token expired or scopes are missing.`,
          );
        } else {
          setShareError(e.message);
        }
      } else if (e instanceof Error) {
        setShareError(e.message);
      } else {
        setShareError("Something went wrong while sharing to Strava.");
      }
    }
  }, [batch, isDevDemo, toast]);

  if (!isAuthenticated) return null;
  if (!batch?.hasPending || batch.events.length === 0) return null;

  return (
    <RunCelebration
      batch={batch}
      onClose={handleClose}
      onShare={handleShare}
      shareState={shareState}
      shareError={shareError}
    />
  );
}
