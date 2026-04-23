/**
 * Unified color palette for street polylines
 *
 * Uses a "cold to warm" progression that feels intuitive:
 * - Not started: faded/invisible (nothing done yet)
 * - In progress: cool cyan (started, but far to go)
 * - Almost there: warm amber (getting hot!)
 * - Completed: vibrant green (achievement unlocked)
 *
 * Highlight is hot pink — distinct from every status color and GPS traces.
 */
export const MAP_COLORS = {
  COMPLETED: "#10b981", // Emerald green - achievement
  ALMOST_THERE: "#f59e0b", // Amber - getting warm!
  IN_PROGRESS: "#06b6d4", // Cyan - cool, just started
  NOT_RUN: "#d1d5db", // Light gray - barely visible
  /** @deprecated Use ALMOST_THERE or IN_PROGRESS */
  PARTIAL: "#f59e0b",
  HIGHLIGHT: "#7c3aed", // Violet — matches the project-radius circle; distinct from every status color
  HIGHLIGHT_NEW: "#38bdf8", // Sky blue — "streets to discover"; avoids green (= completed)
  HIGHLIGHT_FINISH: "#fb7185", // Rose — "streets to finish"; avoids amber (= almost done)
  UNCOVERED: "#e5e7eb", // Very light gray for uncovered portions
} as const;

/**
 * Line weights — same width for highlights so street labels stay readable
 */
export const MAP_WEIGHTS = {
  DEFAULT: 3,
  HIGHLIGHT: 3,
} as const;

/**
 * Dash patterns - smaller gaps for cleaner look
 */
export const MAP_DASH = {
  PARTIAL: "4, 4",
  ALMOST_THERE: "4, 4",
  IN_PROGRESS: "4, 6",
  NOT_RUN: "2, 6",
  UNCOVERED: "2, 6",
} as const;

/**
 * Opacity values - varies by status for visual hierarchy
 * Completed is most prominent, not started fades into background
 */
export const MAP_OPACITY = {
  COMPLETED: 0.9,
  ALMOST_THERE: 0.8,
  IN_PROGRESS: 0.7,
  NOT_RUN: 0.45,
  UNCOVERED: 0.35,
  HIGHLIGHT: 1.0,
} as const;

/**
 * Highlight-specific styling — thin white outline for contrast, no glow
 */
export const HIGHLIGHT_STYLE = {
  GLOW_WEIGHT: 12,
  GLOW_OPACITY: 0.3,
  OUTLINE_COLOR: "#ffffff",
  OUTLINE_WEIGHT: 5,
  OUTLINE_OPACITY: 0.5,
  DASH_PATTERN: undefined as string | undefined,
} as const;

/** GPS trace polyline style (CityStrides-inspired) */
export const GPS_TRACE_STYLE = {
  COLOR: "#8B5CF6",
  WEIGHT: 2,
  OPACITY: 0.55,
  LINE_CAP: "round" as const,
  LINE_JOIN: "round" as const,
} as const;

/** Unified zoom levels for maps across the app */
export const MAP_ZOOM = {
  /** Zoom when centered on user location (close enough to see streets clearly) */
  USER_LOCATION: 18,
  /** Zoom when using default/fallback center (wider view but still shows streets) */
  DEFAULT: 15,
  /** Zoom for project detail pages (shows project area well) */
  PROJECT_DETAIL: 16,
  /** Maximum zoom level (over-zoom beyond native tile level for detail) */
  MAX: 20,
} as const;
