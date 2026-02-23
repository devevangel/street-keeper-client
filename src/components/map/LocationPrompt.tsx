/**
 * LocationPrompt
 * Asks user to enable geolocation. Shows loading or error state with retry.
 * Used on HomePage before fetching map streets. Follows EmptyState pattern for error.
 *
 * @example
 * <LocationPrompt isLoading={loading} error={error} onRetry={requestPermission} />
 */

import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";

interface LocationPromptProps {
  /** True while waiting for geolocation permission/result */
  isLoading: boolean;
  /** Error message if permission denied or unavailable */
  error: string | null;
  /** Callback when user clicks the retry/enable action */
  onRetry: () => void;
}

export function LocationPrompt({
  isLoading,
  error,
  onRetry,
}: LocationPromptProps) {
  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 py-8"
        role="status"
        aria-label="Requesting location"
      >
        <p className="text-base text-text-muted">Requesting your location…</p>
        <p className="text-sm text-text-muted">
          Allow access to show streets near you.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Location needed"
        description={error}
        action="Enable location"
        onAction={onRetry}
      />
    );
  }

  return null;
}
