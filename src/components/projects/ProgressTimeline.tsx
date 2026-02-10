/**
 * ProgressTimeline
 * Area chart: cumulative streets completed over time, with goal line and projected finish.
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { SnapshotStreet } from "../../types/api.types";

export interface ProgressTimelineProps {
  streets: SnapshotStreet[];
  totalStreets: number;
  className?: string;
}

function buildChartData(streets: SnapshotStreet[]) {
  const dated = streets
    .filter((s) => s.completed && s.lastRunDate)
    .sort(
      (a, b) =>
        new Date(a.lastRunDate!).getTime() - new Date(b.lastRunDate!).getTime(),
    );

  const grouped = new Map<string, number>();
  dated.forEach((s) => {
    const day = s.lastRunDate!.split("T")[0];
    grouped.set(day, (grouped.get(day) ?? 0) + 1);
  });

  const sortedEntries = Array.from(grouped.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  let cumulative = 0;
  return sortedEntries.map(([date, count]) => {
    cumulative += count;
    return {
      date,
      completed: cumulative,
      label: new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "2-digit",
      }),
    };
  });
}

function getProjectedFinish(
  streets: SnapshotStreet[],
  totalStreets: number,
): string | null {
  const data = buildChartData(streets);
  if (data.length < 2) return null;
  const completed = data[data.length - 1]?.completed ?? 0;
  const remaining = totalStreets - completed;
  if (remaining <= 0) return null;
  const firstDate = new Date(data[0]!.date).getTime();
  const lastDate = new Date(data[data.length - 1]!.date).getTime();
  const daysSpan = (lastDate - firstDate) / (24 * 60 * 60 * 1000);
  const streetsPerDay = daysSpan > 0 ? completed / daysSpan : 0;
  if (streetsPerDay <= 0) return null;
  const daysLeft = remaining / streetsPerDay;
  const finishDate = new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000);
  return finishDate.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export function ProgressTimeline({
  streets,
  totalStreets,
  className = "",
}: ProgressTimelineProps) {
  const data = buildChartData(streets);
  const projectedFinish = getProjectedFinish(streets, totalStreets);

  if (data.length === 0) {
    return (
      <div
        className={`flex min-h-[200px] items-center justify-center text-sm text-text-muted ${className}`}
      >
        Complete more runs to see your progress trend
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) =>
              new Date(date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            }
            tick={{ fontFamily: "var(--font-family)", fontSize: 12 }}
          />
          <YAxis
            tick={{ fontFamily: "var(--font-family)" }}
            domain={[
              0,
              Math.max(totalStreets, data[data.length - 1]?.completed ?? 0),
            ]}
          />
          <Tooltip
            contentStyle={{
              border: "2px solid var(--color-border)",
              fontFamily: "var(--font-family)",
            }}
            labelFormatter={(_, payload) => payload[0]?.payload?.label ?? ""}
            formatter={(value: number | undefined) => [
              `${value ?? 0} streets`,
              "Cumulative",
            ]}
          />
          <ReferenceLine
            y={totalStreets}
            stroke="var(--color-text-muted)"
            strokeDasharray="4 4"
            label={{ value: "Goal", position: "right" }}
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#16a34a"
            fill="#16a34a"
            fillOpacity={0.4}
            name="Completed"
          />
        </AreaChart>
      </ResponsiveContainer>
      {projectedFinish && (
        <p className="mt-1 text-center text-xs text-text-muted">
          At this pace, you&apos;ll finish by {projectedFinish}
        </p>
      )}
    </div>
  );
}
