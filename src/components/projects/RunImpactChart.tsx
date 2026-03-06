/**
 * RunImpactChart
 * Stacked bar chart: streets completed and improved per activity.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ProjectActivityItem } from "../../types/api.types";

export interface RunImpactChartProps {
  activities: ProjectActivityItem[];
  className?: string;
}

const DISPLAY_LIMIT = 20;

function buildData(activities: ProjectActivityItem[]) {
  const reversed = activities.slice().reverse();
  const limited = reversed.slice(-DISPLAY_LIMIT);
  return limited.map((a) => ({
    label: new Date(a.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    date: a.date,
    name: a.activityName,
    completed: a.streetsCompleted,
    improved: a.streetsImproved,
    distanceKm: +(a.distanceMeters / 1000).toFixed(1),
  }));
}

export function RunImpactChart({
  activities,
  className = "",
}: RunImpactChartProps) {
  const data = buildData(activities);
  const totalActivities = activities.length;
  const showingLimited = totalActivities > DISPLAY_LIMIT;

  if (data.length === 0) {
    return (
      <div
        className={`flex min-h-[200px] items-center justify-center text-sm text-text-muted ${className}`}
      >
        Complete your first run to see your impact here
      </div>
    );
  }

  return (
    <div className={className}>
      {showingLimited && (
        <p className="mb-1 text-center text-xs text-text-muted">
          Showing last {DISPLAY_LIMIT} runs
        </p>
      )}
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            tick={{ fontFamily: "var(--font-family)", fontSize: 11 }}
          />
          <YAxis
            tick={{ fontFamily: "var(--font-family)" }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              border: "2px solid var(--color-border)",
              fontFamily: "var(--font-family)",
            }}
            labelFormatter={(_, payload) => {
              const p = payload[0]?.payload;
              return p?.name ? `${p.name} · ${p.distanceKm} km` : "";
            }}
            formatter={(value: number | undefined, name?: string) => [
              value ?? 0,
              name === "completed" ? "Completed" : "Improved",
            ]}
          />
          <Legend
            formatter={(value) =>
              value === "completed" ? "Streets completed" : "Streets improved"
            }
          />
          <Bar
            dataKey="completed"
            stackId="impact"
            fill="#10b981"
            name="completed"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="improved"
            stackId="impact"
            fill="#f59e0b"
            name="improved"
            radius={[0, 0, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
