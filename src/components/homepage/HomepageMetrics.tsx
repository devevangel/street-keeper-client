import { Card } from "../common";
// import { SectionHeading } from "../common/SectionHeading";

export interface HomepageMetricsProps {
  totalDistanceKm: number | null | undefined;
  totalActivities: number | null | undefined;
}

export function HomepageMetrics({
  totalDistanceKm,
  totalActivities,
}: HomepageMetricsProps) {
  const kmDisplay =
    totalDistanceKm != null ? `${totalDistanceKm.toFixed(2)} km` : "—";
  const runs = totalActivities != null ? String(totalActivities) : "—";

  return (
    <Card padding="none" className="w-full p-3">
      {/* <SectionHeading>Totals</SectionHeading> */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1 border-border/40 pr-4 sm:border-r">
          <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Total Distance
          </p>
          <p className="mt-1 whitespace-nowrap text-xl font-bold leading-tight text-text">
            {kmDisplay}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Total Runs
          </p>
          <p className="mt-1 whitespace-nowrap text-xl font-bold leading-tight text-text">
            {runs}
          </p>
        </div>
      </div>
    </Card>
  );
}
