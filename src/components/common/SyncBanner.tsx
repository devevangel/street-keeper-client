/**
 * SyncBanner
 * Non-blocking banner for background Strava sync: queued, running (with progress), completed (auto-dismiss), or failed.
 */
import { useState, useEffect } from "react";
import { ProgressBar } from "./ProgressBar";
import { Button } from "./Button";
import type { UseSyncStatusResult } from "../../hooks/useSyncStatus";

const COMPLETED_AUTO_DISMISS_MS = 5000;

export interface SyncBannerProps {
  /** From useSyncStatus() */
  sync: UseSyncStatusResult;
  /** Called when user dismisses the banner */
  onDismiss?: () => void;
  /** Called when user taps retry after failed sync (optional) */
  onRetry?: () => void;
  /** Optional: class for the container */
  className?: string;
}

export function SyncBanner({
  sync,
  onDismiss,
  onRetry,
  className = "",
}: SyncBannerProps) {
  const [completedDismissed, setCompletedDismissed] = useState(false);
  const [failedDismissed, setFailedDismissed] = useState(false);

  const { status, total, processed, errors, isActive: _isActive, didComplete: _didComplete, appearsStuck } = sync;

  // Auto-dismiss completed state after 5s
  useEffect(() => {
    if (status !== "completed") return;
    const t = setTimeout(() => setCompletedDismissed(true), COMPLETED_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [status]);

  if (status === "idle") return null;
  if (status === "completed" && completedDismissed) return null;
  if (status === "failed" && failedDismissed) return null;

  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border border-border bg-bg px-3 py-2 shadow-sm ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {status === "queued" && (
            <p className="text-sm font-medium text-text">
              Preparing to sync your runs…
            </p>
          )}
          {status === "running" && (
            <>
              <p className="text-sm font-medium text-text">
                Syncing your runs… {processed} of {total} processed
              </p>
              <ProgressBar percentage={percentage} height={6} className="mt-1" />
            </>
          )}
          {status === "completed" && (
            <p className="text-sm font-medium text-success">
              Sync complete! {processed} activities synced.
            </p>
          )}
          {status === "failed" && (
            <p className="text-sm font-medium text-danger">
              Sync encountered errors. {processed} of {total} processed.
              {errors > 0 && ` (${errors} error${errors !== 1 ? "s" : ""})`}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {status === "queued" && appearsStuck && onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
          {status === "completed" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCompletedDismissed(true);
                onDismiss?.();
              }}
            >
              Dismiss
            </Button>
          )}
          {status === "failed" && (
            <>
              {onRetry && (
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFailedDismissed(true);
                  onDismiss?.();
                }}
              >
                Dismiss
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
