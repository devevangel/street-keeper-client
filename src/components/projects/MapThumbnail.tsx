/**
 * MapThumbnail
 * Clickable map preview that links to full-page map and heatmap.
 */

import { Link } from "react-router-dom";

export interface MapThumbnailProps {
  projectId: string;
  projectName: string;
  children?: React.ReactNode;
}

export function MapThumbnail({
  projectId,
  projectName,
  children,
}: MapThumbnailProps) {
  return (
    <div className="rounded border-2 border-border bg-surface p-3">
      <div className="mb-2 text-sm font-bold uppercase tracking-wide text-text-muted">
        Map
      </div>
      {children && (
        <div className="mb-2 min-h-[120px] overflow-hidden rounded border border-border">
          {children}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Link
          to={`/projects/${projectId}/map`}
          className="inline-block rounded border-2 border-border bg-surface px-3 py-1.5 text-text text-sm hover:bg-border"
          aria-label={`View full map for ${projectName}`}
        >
          View Full Map
        </Link>
        <Link
          to={`/projects/${projectId}/heatmap`}
          className="inline-block rounded border-2 border-border bg-surface px-3 py-1.5 text-text text-sm hover:bg-border"
          aria-label={`View heatmap for ${projectName}`}
        >
          View Heatmap
        </Link>
      </div>
    </div>
  );
}
