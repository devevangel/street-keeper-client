/**
 * EmptyState
 * Shown when a list or section has no data. Guides the user toward their first action per MAIN-STYLING-GUIDE.
 *
 * @example
 * <EmptyState
 *   title="No streets completed yet"
 *   description="Upload a run or sync from Strava to see your progress."
 *   action="Sync from Strava"
 *   onAction={handleSync}
 * />
 */

import { Button } from "./Button";

export interface EmptyStateProps {
  /** Short title (e.g. "No streets completed yet") */
  title: string;
  /** Explanation and what to do next */
  description: string;
  /** Label for the primary action button (optional) */
  action?: string;
  /** Called when user clicks the action button (optional) */
  onAction?: () => void;
  /** Additional CSS classes for the root element */
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col gap-4 py-8 text-center ${className}`.trim()}
      role="status"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-text">{title}</h2>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
      {action && onAction && (
        <div className="flex justify-center">
          <Button variant="primary" onClick={onAction}>
            {action}
          </Button>
        </div>
      )}
    </div>
  );
}
