/**
 * LocationPrompt Component
 * Asks user to enable geolocation. Shows loading or error state with retry.
 * Used on HomePage before fetching map streets.
 */

import { Card } from "../common";

interface LocationPromptProps {
  /** True while waiting for geolocation permission/result */
  isLoading: boolean;
  /** Error message if permission denied or unavailable */
  error: string | null;
  /** Callback when user clicks "Try again" */
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
        <p className="text-text-muted">Requesting your location...</p>
        <p className="text-sm text-text-muted">
          Allow access to show streets near you.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <h2 className="mb-2 text-xl font-bold">Location needed</h2>
        <p className="mb-4 text-text-muted" role="alert">
          {error}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="border-2 border-border bg-surface px-4 py-2 font-bold text-text hover:opacity-90"
        >
          Try again
        </button>
      </Card>
    );
  }

  return null;
}
