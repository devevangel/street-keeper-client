/**
 * Streak display. Firm-but-kind: at risk = amber, not red.
 */
import type { HomepagePayload } from "../../services/homepage.service";

interface StreakBlockProps {
  streak: HomepagePayload["streak"] | null | undefined;
}

export function StreakBlock({ streak }: StreakBlockProps) {
  if (!streak) return null;
  if (streak.currentWeeks === 0 && !streak.isAtRisk) return null;

  const atRisk = streak.isAtRisk && streak.currentWeeks > 0;
  const styles = atRisk
    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";

  return (
    <div
      className={`border-2 rounded p-3 ${styles}`}
      data-streak-weeks={streak.currentWeeks}
      data-at-risk={atRisk}
    >
      <p className="font-medium">
        {streak.currentWeeks}-week streak
        {atRisk && " — run this week to keep it"}
      </p>
      {streak.lastRunDate && (
        <p className="text-sm opacity-90 mt-0.5">
          Last run: {streak.lastRunDate}
        </p>
      )}
    </div>
  );
}
