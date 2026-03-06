/**
 * CompletionFunnel
 * Horizontal bar chart: streets binned by progress (Completed, Almost there, In progress, Not started).
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { SnapshotStreet } from "../../types/api.types";

export interface CompletionFunnelProps {
  streets: SnapshotStreet[];
  className?: string;
}

const BINS = [
  { label: "Completed", min: 90, max: 100, color: "#10b981", hint: "Done!" },
  {
    label: "Almost there",
    min: 50,
    max: 89,
    color: "#f59e0b",
    hint: "One more run through and they're done!",
  },
  {
    label: "In progress",
    min: 1,
    max: 49,
    color: "#06b6d4",
    hint: "You've started these streets.",
  },
  {
    label: "Not started",
    min: 0,
    max: 0,
    color: "#d1d5db",
    hint: "Not run yet.",
  },
];

function buildData(streets: SnapshotStreet[]) {
  return BINS.map((bin) => ({
    label: bin.label,
    count: streets.filter((s) =>
      bin.min === 0 && bin.max === 0
        ? s.percentage === 0
        : s.percentage >= bin.min && s.percentage <= bin.max,
    ).length,
    color: bin.color,
    hint: bin.hint,
  })).filter((d) => d.count > 0);
}

export function CompletionFunnel({
  streets,
  className = "",
}: CompletionFunnelProps) {
  const data = buildData(streets);
  const almostThereCount =
    data.find((d) => d.label === "Almost there")?.count ?? 0;

  if (data.length === 0) {
    return (
      <div
        className={`flex min-h-[120px] items-center justify-center text-sm text-text-muted ${className}`}
      >
        No street data yet
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer
        width="100%"
        height={Math.max(200, data.length * 40)}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 90, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis type="number" tick={{ fontFamily: "var(--font-family)" }} />
          <YAxis
            type="category"
            dataKey="label"
            width={85}
            tick={{ fontFamily: "var(--font-family)", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              border: "2px solid var(--color-border)",
              fontFamily: "var(--font-family)",
            }}
            formatter={(value: number | undefined, _name, props) => {
              const hint = props.payload?.hint ?? "";
              return [`${value ?? 0} streets — ${hint}`, ""];
            }}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="count" name="Streets" radius={0}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {almostThereCount > 0 && (
        <p className="mt-2 text-center text-xs text-text-muted">
          You have {almostThereCount} street{almostThereCount !== 1 ? "s" : ""}{" "}
          that are almost done — focus here for quick wins!
        </p>
      )}
    </div>
  );
}
