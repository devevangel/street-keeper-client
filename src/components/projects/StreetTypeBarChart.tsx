/**
 * StreetTypeBarChart
 * Horizontal bar chart: streets by highway type (residential, primary, etc.).
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

const BAR_COLORS = [
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#7c3aed",
  "#94a3b8",
];

export interface StreetTypeBarChartProps {
  data: { type: string; total: number; completed: number }[];
  className?: string;
}

export function StreetTypeBarChart({
  data,
  className = "",
}: StreetTypeBarChartProps) {
  const chartData = data.map((d) => ({
    type: d.type.replace(/_/g, " "),
    total: d.total,
    completed: d.completed,
  }));

  if (chartData.length === 0) {
    return (
      <div
        className={`flex min-h-[120px] items-center justify-center text-text-muted text-sm ${className}`}
      >
        No street types yet
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis type="number" tick={{ fontFamily: "var(--font-family)" }} />
          <YAxis
            type="category"
            dataKey="type"
            width={75}
            tick={{ fontFamily: "var(--font-family)", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              border: "2px solid var(--color-border)",
              fontFamily: "var(--font-family)",
            }}
            formatter={(value: number | undefined) => [value ?? 0, ""]}
            labelFormatter={(label) => `Type: ${label}`}
          />
          <Bar dataKey="total" name="Total" radius={0}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={BAR_COLORS[index % BAR_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
