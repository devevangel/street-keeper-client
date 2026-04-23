/**
 * Skeleton loading placeholders
 * Provides consistent skeleton UI across the app
 */

interface SkeletonProps {
  className?: string;
}

/** Basic skeleton bar - use for text, buttons, etc. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-border/50 ${className}`}
      aria-hidden="true"
    />
  );
}

/** Skeleton for a card layout */
export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-lg border border-border bg-surface p-4 ${className}`}>
      <Skeleton className="mb-3 h-5 w-3/4" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-4 h-4 w-2/3" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

/** Skeleton for a list item */
export function SkeletonListItem({ className = "" }: SkeletonProps) {
  return (
    <div className={`flex items-center gap-3 p-3 ${className}`}>
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1">
        <Skeleton className="mb-2 h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** Skeleton for a street row in project list */
export function SkeletonStreetRow({ className = "" }: SkeletonProps) {
  return (
    <div className={`flex items-center gap-3 border-b border-border p-3 last:border-b-0 ${className}`}>
      <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

/** Skeleton for project card on homepage */
export function SkeletonProjectCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-lg border border-border bg-surface p-4 ${className}`}>
      <div className="mb-3 flex items-start justify-between">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

/** Skeleton for milestone card */
export function SkeletonMilestoneCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-lg border border-border bg-surface p-4 ${className}`}>
      <div className="mb-2 flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="mb-2 h-3 w-3/4" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

/** Skeleton for the map area */
export function SkeletonMap({ className = "" }: SkeletonProps) {
  return (
    <div className={`relative flex items-center justify-center bg-border/10 ${className}`}>
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-text" />
        <Skeleton className="mx-auto h-4 w-32" />
      </div>
    </div>
  );
}
