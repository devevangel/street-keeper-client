/** Unified color palette for street polylines - matches filter pill colors */
export const MAP_COLORS = {
  COMPLETED: "#16a34a",
  ALMOST_THERE: "#ca8a04",
  IN_PROGRESS: "#2563eb",
  NOT_RUN: "#9ca3af",
  /** @deprecated Use ALMOST_THERE or IN_PROGRESS */
  PARTIAL: "#ca8a04",
  HIGHLIGHT: "#2563eb",
  UNCOVERED: "#dadce0",
} as const;

export const MAP_WEIGHTS = {
  DEFAULT: 4,
  HIGHLIGHT: 6,
} as const;

export const MAP_DASH = {
  PARTIAL: "6, 6",
  ALMOST_THERE: "6, 6",
  IN_PROGRESS: "6, 6",
  NOT_RUN: "4, 8",
  UNCOVERED: "4, 8",
} as const;

/** Unified zoom levels for maps across the app */
export const MAP_ZOOM = {
  /** Zoom when centered on user location (close enough to see streets clearly) */
  USER_LOCATION: 18,
  /** Zoom when using default/fallback center (wider view but still shows streets) */
  DEFAULT: 15,
  /** Zoom for project detail pages (shows project area well) */
  PROJECT_DETAIL: 16,
  /** Maximum zoom level supported by OpenStreetMap tiles */
  MAX: 19,
} as const;
