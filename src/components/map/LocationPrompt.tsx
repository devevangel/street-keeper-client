/**
 * Location access UI (inline banner only — no full-page loading).
 * Full-screen location prompts were removed in favor of shell-first progressive loading.
 */

import { MapPin } from "lucide-react";

export interface LocationAccessBannerProps {
  error: string;
  onRetry: () => void;
}

/**
 * Compact banner when geolocation is denied and no map fallback is available.
 * Shown in the homepage sidebar, not as a blocking full-page screen.
 */
export function LocationAccessBanner({ error, onRetry }: LocationAccessBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-left text-sm text-text"
    >
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-medium text-text">{error}</p>
          <p className="text-xs text-text-muted">
            We need your location to centre the map and load nearby streets. Open browser settings
            to allow location for this site if you denied it, then try again.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-lg bg-accent-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-primary/90"
          >
            Allow location
          </button>
        </div>
      </div>
    </div>
  );
}
