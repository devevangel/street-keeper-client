/**
 * MetricBlock
 * Reusable label + value display for metrics. Follows MAIN-STYLING-GUIDE: label small/muted above, value large/bold below.
 *
 * @example
 * <MetricBlock label="Streets Completed" value={42} />
 * <MetricBlock label="Coverage" value="32%" size="sm" />
 */

export interface MetricBlockProps {
  /** Small label shown above the value (e.g. "Streets Completed") */
  label: string;
  /** Primary metric: number or string (e.g. 42, "32%", "12.4 km") */
  value: string | number;
  /** Size of the value: sm (base), md (lg), lg (xl/2xl) */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes for the root element */
  className?: string;
}

const valueSizeStyles = {
  sm: "text-base font-semibold",
  md: "text-xl font-bold",
  lg: "text-2xl font-bold",
} as const;

export function MetricBlock({
  label,
  value,
  size = "md",
  className = "",
}: MetricBlockProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`.trim()}>
      <span className="text-sm text-text-muted">{label}</span>
      <span className={valueSizeStyles[size]}>{value}</span>
    </div>
  );
}
