/**
 * Lifetime streets completed + this calendar month (user timezone), from homepage payload.
 */
import { Card } from "../common";
import type { HomepagePayload } from "../../services/homepage.service";

export interface StreetTotalsCardProps {
  streetTotals: HomepagePayload["streetTotals"] | undefined;
}

export function StreetTotalsCard({ streetTotals }: StreetTotalsCardProps) {
  const lifetime =
    streetTotals != null ? String(streetTotals.lifetimeStreetsCompleted) : "—";
  const month =
    streetTotals != null ? String(streetTotals.streetsThisMonth) : "—";
  const monthHint = streetTotals?.monthLabel ?? "";

  return (
    <Card padding="none" className="w-full p-3">
      <div className="flex gap-4">
        <div
          className="min-w-0 flex-1 border-border/40 pr-4 sm:border-r"
          aria-label={`${lifetime === "—" ? "Unknown" : lifetime} streets completed all time`}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Streets completed
          </p>
          <p className="mt-1 whitespace-nowrap text-xl font-bold tabular-nums leading-tight text-text">
            {lifetime}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">All time</p>
        </div>
        <div
          className="min-w-0 flex-1"
          aria-label={
            month === "—"
              ? "Streets completed this month unknown"
              : `${month} streets completed this month (${monthHint})`
          }
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            This month
          </p>
          <p className="mt-1 whitespace-nowrap text-xl font-bold tabular-nums leading-tight text-text">
            {month}
          </p>
          {monthHint ? (
            <p className="mt-0.5 text-[11px] text-text-muted">{monthHint}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
