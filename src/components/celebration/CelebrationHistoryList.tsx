/**
 * Paginated list of past run celebrations.
 *
 * Fetches `/celebrations/history` and renders one card per activity with the
 * rollup stats, affected project names, and a "View" button that re-opens the
 * `RunCelebration` overlay in read-only mode. Used by:
 *   - `RunJournalPage` (global, nav tab)
 *   - `ProjectDetailPage` (scoped via `projectId` prop)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Share2, Sparkles, Trophy } from "lucide-react";
import { Button, Card, EmptyState } from "../common";
import { useFormatters } from "../../contexts/PreferencesContext";
import {
  celebrationsService,
  type CelebrationHistoryEntryDto,
  type PendingCelebrationBatch,
} from "../../services/celebrations.service";
import { RunCelebration } from "./RunCelebration";

export interface CelebrationHistoryListProps {
  /** Scope the list to a single project. Omit for the global journal. */
  projectId?: string;
  /** Override the "no celebrations yet" copy. */
  emptyTitle?: string;
  emptyDescription?: string;
}

const PAGE_SIZE = 20;

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function toReplayBatch(entry: CelebrationHistoryEntryDto): PendingCelebrationBatch {
  return {
    success: true,
    hasPending: true,
    events: entry.events,
    rollup: {
      totalCompleted: entry.rollup.totalCompleted,
      totalStarted: entry.rollup.totalStarted,
      totalImproved: entry.rollup.totalImproved,
      activityCount: 1,
      projectCount: entry.rollup.projectCount,
    },
  };
}

function CountBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "completed" | "started" | "improved";
}) {
  if (value <= 0) return null;
  const toneClass =
    tone === "completed"
      ? "bg-success/10 text-success border-success/30"
      : tone === "started"
        ? "bg-accent/10 text-accent border-accent/30"
        : "bg-warning/10 text-warning border-warning/30";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${toneClass}`}
    >
      <span className="tabular-nums">{value}</span>
      <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </span>
    </span>
  );
}

function HistoryCard({
  entry,
  onOpen,
}: {
  entry: CelebrationHistoryEntryDto;
  onOpen: (entry: CelebrationHistoryEntryDto) => void;
}) {
  const { formatDistance, formatDate } = useFormatters();
  const projectNames = entry.events
    .map((e) => e.projectName)
    .filter((n): n is string => Boolean(n));
  const hasProjectCompleted = entry.events.some((e) => e.projectCompleted);

  return (
    <Card padding="md" className="w-full">
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className="flex w-full items-start gap-3 text-left"
        aria-label="Replay this celebration"
      >
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
          {hasProjectCompleted ? (
            <Trophy className="h-5 w-5" aria-hidden />
          ) : (
            <Sparkles className="h-5 w-5" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-text">
              {formatDate(entry.activityStartDate)}
            </span>
            <span className="text-xs text-text-muted tabular-nums">
              {formatDistance(entry.activityDistanceMeters)} ·{" "}
              {formatDuration(entry.activityDurationSeconds)}
            </span>
            {entry.sharedToStrava ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted"
                title="Posted to Strava"
              >
                <Share2 className="h-3 w-3" aria-hidden /> Shared
              </span>
            ) : null}
          </div>
          {projectNames.length > 0 ? (
            <p className="truncate text-xs text-text-muted">
              {projectNames.join(" · ")}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <CountBadge
              label="completed"
              value={entry.rollup.totalCompleted}
              tone="completed"
            />
            <CountBadge
              label="started"
              value={entry.rollup.totalStarted}
              tone="started"
            />
            <CountBadge
              label="improved"
              value={entry.rollup.totalImproved}
              tone="improved"
            />
          </div>
        </div>
        <ChevronRight
          className="mt-2 h-4 w-4 shrink-0 text-text-muted"
          aria-hidden
        />
      </button>
    </Card>
  );
}

export function CelebrationHistoryList({
  projectId,
  emptyTitle,
  emptyDescription,
}: CelebrationHistoryListProps) {
  const [entries, setEntries] = useState<CelebrationHistoryEntryDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replay, setReplay] = useState<PendingCelebrationBatch | null>(null);
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      const myId = ++requestIdRef.current;
      if (append) {
        setLoadingMore(true);
      } else {
        setInitialLoading(true);
      }
      setError(null);
      try {
        const page = await celebrationsService.getHistory({
          cursor,
          limit: PAGE_SIZE,
          projectId: projectId ?? null,
        });
        if (myId !== requestIdRef.current) return;
        setEntries((prev) => (append ? [...prev, ...page.entries] : page.entries));
        setNextCursor(page.nextCursor);
      } catch (e) {
        if (myId !== requestIdRef.current) return;
        const message =
          e instanceof Error ? e.message : "Failed to load celebrations";
        setError(message);
      } finally {
        if (myId === requestIdRef.current) {
          setLoadingMore(false);
          setInitialLoading(false);
        }
      }
    },
    [projectId],
  );

  useEffect(() => {
    void fetchPage(null, false);
  }, [fetchPage]);

  const handleReplay = useCallback((entry: CelebrationHistoryEntryDto) => {
    setReplay(toReplayBatch(entry));
  }, []);

  const handleCloseReplay = useCallback(() => setReplay(null), []);

  if (initialLoading && entries.length === 0) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i} padding="md">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-border" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-border" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-border/70" />
                <div className="h-5 w-40 animate-pulse rounded bg-border/50" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <Card padding="md" className="text-center">
        <p className="text-sm text-danger">{error}</p>
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="mt-3"
          onClick={() => void fetchPage(null, false)}
        >
          Try again
        </Button>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? "No celebrations yet"}
        description={
          emptyDescription ??
          "Once you finish a run that completes, starts or improves streets, it’ll show up here."
        }
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={entry.groupKey}>
            <HistoryCard entry={entry} onOpen={handleReplay} />
          </li>
        ))}
      </ul>

      {nextCursor ? (
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={loadingMore}
            onClick={() => void fetchPage(nextCursor, true)}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}

      {replay ? (
        <RunCelebration
          batch={replay}
          onClose={handleCloseReplay}
          readOnly
        />
      ) : null}
    </>
  );
}
