import { Skeleton } from "../common";

export function HomepageSkeleton() {
  return (
    <div className="flex w-full flex-col gap-3 p-3 md:p-4">
      {/* Greeting */}
      <Skeleton className="h-7 w-48" />

      {/* Metrics row (TOTAL DISTANCE / TOTAL RUNS) */}
      <div className="grid w-full grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface p-4">
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>

      {/* YOUR RUNS — last run + 3 recent runs */}
      <div className="w-full rounded-lg border border-border bg-surface p-4">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="mb-2 h-12 w-full rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* STREETS ON MAP — 2×2 filter bins + traces toggle */}
      <div className="w-full rounded-lg border border-border bg-surface p-4">
        <Skeleton className="mb-1 h-3 w-28" />
        <Skeleton className="mb-3 h-3 w-48" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
        <Skeleton className="mt-3 h-10 w-full rounded-lg" />
      </div>

      {/* NEXT RUN SUGGESTIONS */}
      <div className="w-full rounded-lg border border-border bg-surface p-4">
        <Skeleton className="mb-3 h-3 w-32" />
        <Skeleton className="mb-3 h-5 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
        <Skeleton className="mt-3 h-10 w-full rounded-lg" />
      </div>

      {/* CTA button */}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}
