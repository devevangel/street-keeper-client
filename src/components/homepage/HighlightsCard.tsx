/**
 * HighlightsCard
 * Favorite streets (top 3), exploration style badge, account stats.
 */

import { Card } from "../common/Card";
import type { HomepagePayload } from "../../services/homepage.service";

interface HighlightsCardProps {
  data: HomepagePayload;
}

const EXPLORATION_LABELS: Record<string, string> = {
  trailblazer: "Trailblazer — you love new streets",
  balanced: "Balanced — mix of new and familiar",
  habitual: "Habitual — you know your routes",
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export function HighlightsCard({ data }: HighlightsCardProps) {
  const stats = data.userStats;
  const streak = data.streak;

  if (!stats && !streak) return null;

  const favorites = stats?.favoriteStreets?.slice(0, 3) ?? [];
  const styleLabel = stats?.explorationStyle
    ? EXPLORATION_LABELS[stats.explorationStyle] ?? stats.explorationStyle
    : null;
  const activeSince = stats?.accountCreatedAt
    ? formatDate(stats.accountCreatedAt)
    : null;
  const bestStreak = streak?.longestStreak ?? 0;

  return (
    <Card className="card-interactive space-y-3" padding="md">
      <h3 className="text-sm font-semibold text-text-muted">Highlights</h3>
      {favorites.length > 0 && (
        <div>
          <p className="text-xs text-text-muted mb-1">Favorite streets</p>
          <ul className="text-sm text-text space-y-0.5">
            {favorites.map((s, i) => (
              <li key={i}>
                {s.name} <span className="text-text-muted">· {s.runCount}×</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {styleLabel && (
        <p className="text-sm text-text-muted italic">{styleLabel}</p>
      )}
      {(activeSince || bestStreak > 0) && (
        <div className="text-xs text-text-muted space-y-0.5">
          {activeSince && <p>Active since: {activeSince}</p>}
          {bestStreak > 0 && (
            <p>Best streak: {bestStreak} week{bestStreak !== 1 ? "s" : ""}</p>
          )}
        </div>
      )}
    </Card>
  );
}
