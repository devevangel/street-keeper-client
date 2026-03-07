/**
 * Motivational copy helpers
 * Achievement-focused messaging (e.g. "streets conquered" instead of "remaining").
 */

/**
 * Progress message for completed/total (e.g. "42 streets conquered!" or "Nearly a third explored!").
 */
export function getProgressMessage(completed: number, total: number): string {
  if (total <= 0) return "No streets yet";
  if (completed >= total) return "All streets conquered!";
  const pct = Math.round((completed / total) * 100);
  if (pct >= 33 && pct < 50) return "Nearly a third explored!";
  if (pct >= 50 && pct < 66) return "Over halfway there!";
  if (pct >= 66 && pct < 100) return "Two-thirds explored!";
  return `${completed} streets conquered!`;
}

/**
 * Street status message by percentage (for list items).
 */
export function getStreetStatusMessage(percentage: number): string {
  if (percentage >= 100) return "Conquered!";
  if (percentage >= 95) return "One more run!";
  if (percentage >= 75) return "So close!";
  if (percentage > 0) return "Started exploring";
  return "New adventure awaits!";
}

/**
 * Milestone message: "X more to go!" for next target.
 */
export function getMilestoneMessage(current: number, target: number): string {
  const remaining = Math.max(0, target - current);
  if (remaining === 0) return "Done!";
  return `${remaining} more to go!`;
}

/**
 * Next milestone target (e.g. 25, 50, 75, 100) given current progress.
 */
export function getNextMilestoneTarget(current: number): number {
  const milestones = [25, 50, 75, 100];
  const next = milestones.find((m) => m > current);
  return next ?? 100;
}
