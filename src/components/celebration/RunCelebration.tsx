/**
 * Run celebration overlay — presentation only (no data fetching).
 */

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Loader2, X } from "lucide-react";
import { Button } from "../common";
import type { PendingCelebrationBatch, PendingCelebrationEventDto } from "../../services/celebrations.service";

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
const SK_HASHTAG_FOOTER_RE = /\n?\n?#StreetKeeper #RunEveryStreet\s*$/;

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
        {names.map((name) => (
          <li
            key={name}
            className="truncate rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text"
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectCard({ event }: { event: PendingCelebrationEventDto }) {
  const [open, setOpen] = useState(false);
  const title = event.projectName ?? "Project";
  const hasStreets =
    event.completedStreetNames.length > 0 ||
    event.startedStreetNames.length > 0 ||
    event.improvedStreetNames.length > 0;

  return (
    <article className="rounded-xl border border-border bg-card-bg p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-text">{title}</h3>
        <span className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted">
          {event.projectProgressBefore}% → {event.projectProgressAfter}%
          {event.projectCompleted ? (
            <span className="ml-1 font-semibold text-success">Complete</span>
          ) : null}
        </span>
      </div>

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

export function RunCelebration({
  batch,
  onClose,
  onShare,
  shareState,
  shareError,
}: RunCelebrationProps) {
  const firstActivityId = batch.events[0]?.activityId ?? "";
  const headlineIndex = firstActivityId ? hashString(firstActivityId) % HEADLINES.length : 0;
  const headline = HEADLINES[headlineIndex] ?? HEADLINES[0];

  const stravaPreview = useMemo(() => buildStravaPreview(batch.events), [batch.events]);

  const { rollup } = batch;

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
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          <h2
            id="run-celebration-headline"
            className="text-center text-xl font-bold leading-snug text-text sm:text-2xl"
          >
            {headline}
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <StatChip label="Completed" value={rollup.totalCompleted} />
            <StatChip label="Started" value={rollup.totalStarted} />
            <StatChip label="Improved" value={rollup.totalImproved} />
          </div>

          <div className="mt-6 space-y-4">
            {batch.events.map((event) => (
              <ProjectCard key={event.id} event={event} />
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
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sharing…</>
              ) : shareState === "shared" ? (
                <><CheckCircle2 className="h-4 w-4" aria-hidden /> Shared</>
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
