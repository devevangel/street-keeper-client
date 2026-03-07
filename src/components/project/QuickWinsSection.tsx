/**
 * QuickWinsSection
 * Streets at 75%+ completion; each with progress and "Show on map".
 */

import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { ProgressBar } from "../common/ProgressBar";
import type { ProjectQuickWin } from "../../types/api.types";

interface QuickWinsSectionProps {
  quickWins: ProjectQuickWin[];
  onShowOnMap: (osmId: string) => void;
}

function formatRemaining(meters: number): string {
  if (meters < 1000) return `~${Math.round(meters)} m to go`;
  return `~${(meters / 1000).toFixed(1)} km to go`;
}

export function QuickWinsSection({ quickWins, onShowOnMap }: QuickWinsSectionProps) {
  if (!quickWins.length) return null;

  return (
    <Card className="card-interactive" padding="md">
      <h3 className="text-sm font-semibold text-text-muted mb-3">So close!</h3>
      <ul className="space-y-3">
        {quickWins.map((qw) => (
          <li key={qw.osmId} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-text truncate">{qw.name}</span>
              <span className="text-xs text-text-muted shrink-0">{qw.percentage}%</span>
            </div>
            <ProgressBar value={qw.percentage} size="sm" />
            <p className="text-xs text-text-muted">{formatRemaining(qw.remainingMeters)}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => onShowOnMap(qw.osmId)}
            >
              Show on map
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
