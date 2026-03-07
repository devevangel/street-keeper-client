/**
 * NextRunCard
 * Your next run: primarySuggestion or firstStreet or "Go for a run" fallback.
 * Progress bar for almost-complete streets; [Show on Map] CTA.
 */

import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { ProgressBar } from "../common/ProgressBar";
import type { HomepagePayload } from "../../services/homepage.service";

interface NextRunCardProps {
  data: HomepagePayload;
  onShowOnMap: () => void;
}

export function NextRunCard({ data, onShowOnMap }: NextRunCardProps) {
  const suggestion = data.primarySuggestion;
  const firstStreet = data.firstStreet;

  const title = suggestion?.title ?? (firstStreet ? `Run ${firstStreet.name}` : "Go for a run");
  const copy =
    suggestion?.shortCopy ??
    (firstStreet
      ? `About ${(firstStreet.lengthMeters / 1000).toFixed(1)} km — closest unrun street`
      : "Sync Strava or head out to start conquering streets.");
  const showButton = !!(suggestion?.focus || firstStreet);

  const progress =
    data.nextMilestone?.progress.ratio != null
      ? Math.round(data.nextMilestone.progress.ratio * 100)
      : null;

  return (
    <Card className="card-interactive space-y-3" padding="md">
      <h3 className="text-sm font-semibold text-text-muted">Your next run</h3>
      <h4 className="text-base font-bold text-text">{title}</h4>
      <p className="text-sm text-text-muted">{copy}</p>
      {progress != null && progress > 0 && progress < 100 && (
        <div className="space-y-1">
          <ProgressBar value={progress} size="sm" />
          <span className="text-xs text-text-muted">
            Next: {data.nextMilestone?.name} — {100 - progress}% to go
          </span>
        </div>
      )}
      {showButton && (
        <Button type="button" variant="primary" size="md" onClick={onShowOnMap}>
          Show on map
        </Button>
      )}
    </Card>
  );
}
