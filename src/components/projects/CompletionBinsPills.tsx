/**
 * CompletionBinsPills
 * Four colored pill badges for completed, almost there, in progress, not started.
 * Replaces the CompletionFunnel chart with a clearer at-a-glance summary.
 */

import type { CompletionBins } from "../../types/api.types";

export interface CompletionBinsPillsProps {
  bins: CompletionBins;
  className?: string;
}

const PILLS: Array<{
  key: keyof CompletionBins;
  label: string;
  dotColor: string;
}> = [
  { key: "completed", label: "Completed", dotColor: "bg-[#10b981]" },
  { key: "almostThere", label: "Almost there", dotColor: "bg-[#f59e0b]" },
  { key: "inProgress", label: "In progress", dotColor: "bg-[#06b6d4]" },
  { key: "notStarted", label: "Not started", dotColor: "bg-[#d1d5db]" },
];

export function CompletionBinsPills({
  bins,
  className = "",
}: CompletionBinsPillsProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 text-sm ${className}`}
      role="list"
    >
      {PILLS.map(({ key, label, dotColor }) => {
        const count = bins[key];
        if (count === 0) return null;
        return (
          <span
            key={key}
            className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-surface px-3 py-1.5"
            role="listitem"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`}
              aria-hidden
            />
            <span className="font-medium text-text">{count}</span>
            <span className="text-text-muted">{label}</span>
          </span>
        );
      })}
    </div>
  );
}
