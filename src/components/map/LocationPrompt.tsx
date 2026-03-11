/**
 * LocationPrompt
 * Full-page permission screen explaining why we need location.
 * Loading state while waiting, and a helpful denial state with instructions.
 */

import { MapPin, Shield, Navigation, RefreshCw } from "lucide-react";
import { ProgressLoader } from "../common/ProgressLoader";

interface LocationPromptProps {
  isLoading: boolean;
  error: string | null;
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
        className="flex min-h-[80vh] items-center justify-center px-4"
        role="status"
        aria-label="Requesting location"
      >
        <div className="flex max-w-sm flex-col items-center text-center">
          <ProgressLoader type="location" size="lg" title="Requesting location access" />
          <p className="mt-4 text-sm text-text-muted">
            Your browser should be asking for permission.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-primary/10">
            <MapPin className="h-10 w-10 text-accent-primary" />
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-text-primary">
              Location makes Street Keeper work
            </h1>
            <p className="text-base leading-relaxed text-text-secondary">
              We need your location to show streets near you, track your runs on the map,
              and give you personalised suggestions. Without it, we can't show your city.
            </p>
          </div>

          {/* Trust signals */}
          <div className="space-y-3 rounded-xl border border-border-primary bg-bg-secondary p-4 text-left">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div>
                <p className="text-sm font-medium text-text-primary">Your data stays private</p>
                <p className="text-xs text-text-muted">
                  Location is used only to centre your map and find nearby streets.
                  We never share or sell your position.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-text-primary">Only while you use the app</p>
                <p className="text-xs text-text-muted">
                  We don't track you in the background. Location is requested once
                  when you open Street Keeper.
                </p>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <p className="text-xs leading-relaxed text-text-muted">
              If you denied the prompt, open your browser settings and allow location
              for this site, then tap "Try again."
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
