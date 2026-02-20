/**
 * Shared street filter utilities for project detail page and homepage.
 */

export type FilterStatus = "all" | "completed" | "almostThere" | "inProgress" | "notStarted";

/** Get completion bin for a street based on percentage and completed flag. */
export function getStreetBin(percentage: number, completed: boolean): FilterStatus {
  if (completed) return "completed";
  if (percentage >= 75) return "almostThere";
  if (percentage > 0) return "inProgress";
  return "notStarted";
}

export const FILTER_PILLS: Array<{
  key: FilterStatus;
  label: string;
  dotColor: string;
}> = [
  { key: "completed", label: "Completed", dotColor: "bg-[#16a34a]" },
  { key: "almostThere", label: "Almost there", dotColor: "bg-[#ca8a04]" },
  { key: "inProgress", label: "In progress", dotColor: "bg-[#2563eb]" },
  { key: "notStarted", label: "Not started", dotColor: "bg-[#9ca3af]" },
];
