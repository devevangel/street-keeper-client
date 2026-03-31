/**
 * NextRunCard
 * Suggested street: primarySuggestion or firstStreet or "Go for a run" fallback.
 * Type badge, bold street name, detail line, optional milestone progress.
 */

import { Button } from "../common/Button";
import { ProgressBar } from "../common/ProgressBar";
import type { HomepagePayload } from "../../services/homepage.service";

interface NextRunCardProps {
  data: HomepagePayload;
  onShowOnMap: () => void;
}

const TYPE_LABELS: Record<string, { label: string; accent: string }> = {
  quick_win: { label: "Quick win", accent: "bg-success/15 text-success" },
  explore: {
    label: "New street",
    accent: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  streak_saver: { label: "Streak saver", accent: "bg-warning/15 text-warning" },
  milestone_push: {
    label: "Milestone push",
    accent: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  },
  repeat_street: {
    label: "Keep going",
    accent: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  },
};

function getTypeBadge(type?: string) {
  if (!type) return null;
  const info = TYPE_LABELS[type];
  if (!info) return null;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.accent}`}
    >
      {info.label}
    </span>
  );
}

export function NextRunCard({ data, onShowOnMap }: NextRunCardProps) {
  const suggestion = data.primarySuggestion;
  const firstStreet = data.firstStreet;

  const streetName = suggestion?.title ?? firstStreet?.name ?? null;
  const copy =
    suggestion?.shortCopy ??
    (firstStreet
      ? `${Math.round(firstStreet.lengthMeters)}m long · ${Math.round(firstStreet.distanceFromUser)}m away from you`
      : "Head out and start conquering streets nearby.");
  const showButton = !!(suggestion?.focus || firstStreet);
  const badge = getTypeBadge(suggestion?.type);

  const progress =
    data.nextMilestone?.progress.ratio != null
      ? Math.round(data.nextMilestone.progress.ratio * 100)
      : null;

  return (
    <div className="rounded-lg border-2 border-border bg-surface p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Suggested run
        </h3>
        {badge}
      </div>

      {streetName ? (
        <p className="mt-2 text-lg font-bold leading-tight text-text">
          {streetName}
        </p>
      ) : (
        <p className="mt-2 text-lg font-bold leading-tight text-text">
          Go for a run
        </p>
      )}

      <p className="mt-1 text-sm text-text-muted">{copy}</p>

      {progress != null && progress > 0 && progress < 100 && (
        <div className="mt-3 space-y-1">
          <ProgressBar percentage={progress} height={4} />
          <p className="text-xs text-text-muted">
            {data.nextMilestone?.name} · {100 - progress}% to go
          </p>
        </div>
      )}

      {showButton && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onShowOnMap}
          className="mt-3"
        >
          Show on map
        </Button>
      )}
    </div>
  );
}
