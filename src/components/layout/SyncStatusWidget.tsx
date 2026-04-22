/**
 * Compact Strava sync indicator for the app header: idle, active progress, or failed with retry.
 */
import { useCallback } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "../common";
import { activitiesService } from "../../services/activities.service";
import type { UseSyncStatusResult } from "../../hooks/useSyncStatus";

function formatRelativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const diffMs = Date.now() - t;
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export interface SyncStatusWidgetProps {
  sync: UseSyncStatusResult;
}

export function SyncStatusWidget({ sync }: SyncStatusWidgetProps) {
  const {
    status,
    total,
    processed,
    errors,
    isActive,
    appearsStuck,
    lastCompletedAt,
    startPolling,
  } = sync;

  const handleRetry = useCallback(async () => {
    try {
      await activitiesService.syncFromStrava({
        background: true,
        bypassCooldown: true,
      });
      startPolling();
    } catch {
      /* status poll will reflect failure */
    }
  }, [startPolling]);

  if (isActive) {
    const label =
      status === "queued"
        ? appearsStuck
          ? "Sync queued…"
          : "Preparing sync…"
        : `Syncing ${processed}${total > 0 ? ` / ${total}` : ""}`;

    return (
      <div
        className="flex max-w-[min(100%,14rem)] items-center gap-2 text-sm text-text"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent-from" aria-hidden />
        <span className="truncate">{label}</span>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex max-w-[min(100%,18rem)] items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 text-danger" aria-hidden />
        <span className="truncate text-sm text-danger">
          Sync failed
          {errors > 0 ? ` (${errors})` : ""}
        </span>
        <Button type="button" variant="secondary" size="sm" onClick={handleRetry}>
          Retry
        </Button>
      </div>
    );
  }

  const relative = formatRelativeTime(lastCompletedAt);
  return (
    <div
      className="flex max-w-[min(100%,14rem)] items-center gap-1.5 text-sm text-text-muted"
      title={
        lastCompletedAt
          ? `Last sync completed ${lastCompletedAt}`
          : "Activities are up to date"
      }
    >
      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
      <span className="truncate">{relative ? `Synced ${relative}` : "Up to date"}</span>
    </div>
  );
}
