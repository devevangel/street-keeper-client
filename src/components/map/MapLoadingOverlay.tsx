/**
 * MapLoadingOverlay
 * Shows a centered loading spinner/message over the map while data is loading.
 */

interface MapLoadingOverlayProps {
  message?: string;
}

export function MapLoadingOverlay({
  message = "Loading map…",
}: MapLoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-bg/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-border bg-surface px-6 py-4 shadow-lg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        <p className="text-sm font-medium text-text">{message}</p>
      </div>
    </div>
  );
}
