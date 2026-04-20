import { Skeleton } from "../common";

export function HomepageSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-28 w-full rounded-card" />
      <Skeleton className="h-20 w-full rounded-card" />
      <Skeleton className="h-16 w-full rounded-card" />
    </div>
  );
}
