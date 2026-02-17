/** Unified color palette for street polylines */
export const MAP_COLORS = {
  COMPLETED: "#16a34a",
  PARTIAL: "#ca8a04",
  NOT_RUN: "#9ca3af",
  HIGHLIGHT: "#2563eb",
  UNCOVERED: "#dadce0",
} as const;

export const MAP_WEIGHTS = {
  DEFAULT: 4,
  HIGHLIGHT: 6,
} as const;

export const MAP_DASH = {
  PARTIAL: "6, 6",
  NOT_RUN: "4, 8",
  UNCOVERED: "4, 8",
} as const;
