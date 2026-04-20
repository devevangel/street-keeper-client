/**
 * Shared street filter utilities for project detail page and homepage.
 */

const UNNAMED_PATTERNS = ["unnamed road", "unnamed", ""];

export function isUnnamedStreet(name: string | null | undefined): boolean {
  if (!name) return true;
  return UNNAMED_PATTERNS.includes(name.toLowerCase().trim());
}

export type FilterStatus = "all" | "completed" | "almostThere" | "inProgress" | "notStarted";

/** Get completion bin for a street based on percentage and completed flag. */
export function getStreetBin(percentage: number, completed: boolean): FilterStatus {
  if (completed) return "completed";
  if (percentage >= 50) return "almostThere";
  if (percentage > 0) return "inProgress";
  return "notStarted";
}

export const FILTER_PILLS: Array<{
  key: FilterStatus;
  label: string;
  dotColor: string;
}> = [
  { key: "completed", label: "Done", dotColor: "bg-[#10b981]" },
  { key: "almostThere", label: "Almost done", dotColor: "bg-[#f59e0b]" },
  { key: "inProgress", label: "Just started", dotColor: "bg-[#06b6d4]" },
  { key: "notStarted", label: "To go", dotColor: "bg-[#d1d5db]" },
];
