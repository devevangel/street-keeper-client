/**
 * Run celebration overlay — presentation only (no data fetching except optional map).
 */

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Loader2, Trophy, X } from "lucide-react";
import { Button } from "../common";
import type {
  PendingCelebrationBatch,
  PendingCelebrationEventDto,
  CelebrationMapData,
} from "../../services/celebrations.service";
import { celebrationsService } from "../../services/celebrations.service";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const CelebrationMiniMap = lazy(() => import("./CelebrationMiniMap"));

const HEADLINES = [
  "You just claimed new ground.",
  "Look what your run did to the map.",
  "The map moved. You moved it.",
  "Another run, another dent in the grid.",
  "Fresh streets on the board.",
  "Your city just got smaller.",
] as const;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const SK_HEADER_RE = /^--- Street Keeper ---\s*\n?/m;
const SK_HASHTAG_FOOTER = "\n\n#StreetKeeper #RunEveryStreet";
const SK_HASHTAG_FOOTER_RE =
  /\n?\n?#StreetKeeper #RunEveryStreet(?:\s+#[A-Za-z0-9_]+)*\s*$/u;

/**
 * Mirrors backend `combineShareBodies` + wrapping so the preview matches what
 * actually gets written to the Strava activity description.
 */
function buildStravaPreview(events: PendingCelebrationEventDto[]): string {
  const bodies = events
    .map((e) => {
      if (!e.shareMessage) return "";
      return e.shareMessage
        .replace(SK_HEADER_RE, "")
        .replace(SK_HASHTAG_FOOTER_RE, "")
        .trim();
    })
    .filter(Boolean);
  if (bodies.length === 0) return "";
  return `--- Street Keeper ---\n${bodies.join("\n\n")}${SK_HASHTAG_FOOTER}`;
}

export interface RunCelebrationProps {
  batch: PendingCelebrationBatch;
  onClose: () => void;
  onShare: () => Promise<void>;
  shareState: "idle" | "sharing" | "shared" | "error";
  shareError?: string | null;
  /** Dev: fixture map from parent. Omit in production — map is fetched here. */
  previewMapData?: CelebrationMapData | null;
}

function StatChip({ label, value }: { label: string; value: number }) {
  if (value <= 0) return null;
  return (
    <div
      className="rounded-lg border border-border bg-card-bg px-3 py-2 text-center shadow-sm"
      role="status"
    >
      <div className="text-lg font-bold tabular-nums text-text">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</div>
    </div>
  );
}

function StreetList({ title, names }: { title: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</p>
      <ul className="flex flex-col gap-1">
        {names.map((name, idx) => (
          <li
            key={`${title}-${idx}-${name}`}
            className="truncate rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text"
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressBarRow({
  before,
  after,
  completed,
  reducedMotion,
}: {
  before: number;
  after: number;
  completed: boolean;
  reducedMotion: boolean;
}) {
  const [w, setW] = useState(() => (reducedMotion ? after : before));

  useEffect(() => {
    if (reducedMotion) {
      setW(after);
      return;
    }
    setW(before);
    const id = requestAnimationFrame(() => setW(after));
    return () => cancelAnimationFrame(id);
  }, [before, after, reducedMotion]);

  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
      <div
        className={`h-full max-w-full rounded-full transition-[width] duration-[900ms] ease-out ${
          completed
            ? "bg-gradient-to-r from-amber-400 to-yellow-500"
            : "bg-success"
        }`}
        style={{ width: `${Math.min(100, Math.max(0, w))}%` }}
      />
    </div>
  );
}

function ProjectCard({
  event,
  reducedMotion,
}: {
  event: PendingCelebrationEventDto;
  reducedMotion: boolean;
}) {
  const [open, setOpen] = useState(false);
  const title = event.projectName ?? "Project";
  const hasStreets =
    event.completedStreetNames.length > 0 ||
    event.startedStreetNames.length > 0 ||
    event.improvedStreetNames.length > 0;
  const done = event.projectCompleted;

  return (
    <article
      className={
        done
          ? "rounded-xl border border-amber-400/40 bg-card-bg p-4 shadow-[0_0_32px_-8px_rgba(251,191,36,0.35)] ring-2 ring-amber-400/50"
          : "rounded-xl border border-border bg-card-bg p-4 shadow-sm"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-text">
          {done ? (
            <Trophy className="h-5 w-5 shrink-0 text-amber-400" aria-hidden />
          ) : null}
          {title}
        </h3>
        <span
          className={
            done
              ? "shrink-0 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-200"
              : "shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted"
          }
        >
          {event.projectProgressBefore}% → {event.projectProgressAfter}%
          {done ? (
            <span className="ml-1 font-semibold text-amber-300">Complete</span>
          ) : null}
        </span>
      </div>

      <ProgressBarRow
        before={event.projectProgressBefore}
        after={event.projectProgressAfter}
        completed={done}
        reducedMotion={reducedMotion}
      />

      {hasStreets ? (
        <div className="mt-3 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-lg py-2 text-left text-sm font-semibold text-accent hover:bg-surface/80"
            aria-expanded={open}
          >
            <span>See all streets</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {open ? (
            <div className="mt-2 space-y-4 rounded-lg border border-border bg-surface p-3">
              <StreetList title="Completed" names={event.completedStreetNames} />
              <StreetList title="Started" names={event.startedStreetNames} />
              <StreetList title="Improved" names={event.improvedStreetNames} />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function MapSkeleton() {
  return (
    <div
      className="flex h-48 w-full animate-pulse items-center justify-center rounded-xl border border-border bg-card-bg sm:h-64"
      aria-hidden
    >
      <span className="text-sm text-text-muted">Loading map…</span>
    </div>
  );
}

export function RunCelebration({
  batch,
  onClose,
  onShare,
  shareState,
  shareError,
  previewMapData,
}: RunCelebrationProps) {
  const reducedMotion = useReducedMotion();
  const [mapData, setMapData] = useState<CelebrationMapData | null>(null);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);

  const firstActivityId = batch.events[0]?.activityId ?? "";
  const headlineIndex = firstActivityId ? hashString(firstActivityId) % HEADLINES.length : 0;
  const headline = HEADLINES[headlineIndex] ?? HEADLINES[0];

  const stravaPreview = useMemo(() => buildStravaPreview(batch.events), [batch.events]);

  const eventIdsKey = batch.events.map((e) => e.id).join(",");

  useEffect(() => {
    if (previewMapData !== undefined) {
      setMapData(previewMapData);
      setMapLoadFailed(false);
      return;
    }
    if (!eventIdsKey) return;
    let cancelled = false;
    setMapLoadFailed(false);
    const ids = eventIdsKey.split(",").filter(Boolean);
    celebrationsService
      .getMapData(ids)
      .then((d) => {
        if (!cancelled) setMapData(d);
      })
      .catch(() => {
        if (!cancelled) {
          setMapData(null);
          setMapLoadFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [eventIdsKey, previewMapData]);

  const { rollup } = batch;

  const showMapSlot =
    previewMapData !== undefined ? previewMapData !== null : !mapLoadFailed && mapData !== null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex flex-col bg-surface/95 text-text backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="run-celebration-headline"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border" aria-hidden />

      <div className="flex shrink-0 justify-end pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))]">
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card-bg text-text-muted transition-colors hover:bg-border/30 hover:text-text"
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-4 pb-2">
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pb-4">
          <h2
            id="run-celebration-headline"
            className="text-center text-xl font-bold leading-snug text-text sm:text-2xl"
          >
            {headline}
          </h2>

          <div className="mt-4">
            {previewMapData === undefined && mapData === null && !mapLoadFailed ? (
              <MapSkeleton />
            ) : null}
            {previewMapData !== undefined && previewMapData === null ? <MapSkeleton /> : null}
            {showMapSlot && mapData ? (
              <Suspense fallback={<MapSkeleton />}>
                <CelebrationMiniMap data={mapData} prefersReducedMotion={reducedMotion} />
              </Suspense>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <StatChip label="Completed" value={rollup.totalCompleted} />
            <StatChip label="Started" value={rollup.totalStarted} />
            <StatChip label="Improved" value={rollup.totalImproved} />
          </div>

          <div className="mt-6 space-y-4">
            {batch.events.map((event) => (
              <ProjectCard key={event.id} event={event} reducedMotion={reducedMotion} />
            ))}
          </div>

          {stravaPreview ? (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-text-muted">
                What gets posted to Strava
              </h3>
              <div className="rounded-xl border border-border bg-card-bg p-3">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-text">
                  {stravaPreview}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-surface/95 px-4 pt-3 backdrop-blur-sm pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-2xl space-y-3">
          {shareError ? (
            <p className="text-center text-sm text-danger" role="alert">
              {shareError}
            </p>
          ) : null}
          <div className="grid grid-cols-2 items-stretch gap-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="h-12 w-full"
              onClick={() => void onShare()}
              disabled={shareState === "sharing" || shareState === "shared"}
            >
              {shareState === "sharing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sharing…
                </>
              ) : shareState === "shared" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> Shared
                </>
              ) : (
                "Share to Strava"
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="h-12 w-full"
              onClick={onClose}
              disabled={shareState === "sharing"}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
