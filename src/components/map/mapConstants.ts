/**
 * Unified color palette for street polylines
 *
 * Uses a "cold to warm" progression that feels intuitive:
 * - Not started: faded/invisible (nothing done yet)
 * - In progress: cool cyan (started, but far to go)
 * - Almost there: warm amber (getting hot!)
 * - Completed: vibrant green (achievement unlocked)
 *
 * Highlight is distinct magenta to avoid confusion with any status.
 */
export const MAP_COLORS = {
  COMPLETED: "#10b981", // Emerald green - achievement
  ALMOST_THERE: "#f59e0b", // Amber - getting warm!
  IN_PROGRESS: "#06b6d4", // Cyan - cool, just started
  NOT_RUN: "#d1d5db", // Light gray - barely visible
  /** @deprecated Use ALMOST_THERE or IN_PROGRESS */
  PARTIAL: "#f59e0b",
  HIGHLIGHT: "#ec4899", // Magenta - distinct, pops on any map
  UNCOVERED: "#e5e7eb", // Very light gray for uncovered portions
} as const;

/**
 * Line weights - thinner to show street names through
 */
export const MAP_WEIGHTS = {
  DEFAULT: 3,
  HIGHLIGHT: 2, // Ultra-thin for highlights - minimizes label coverage
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
  HIGHLIGHT: 0.75, // Reduced opacity so labels show through better
} as const;

/**
 * Highlight-specific styling constants
 */
export const HIGHLIGHT_STYLE = {
  /** White outline/halo around highlight line for contrast */
  OUTLINE_COLOR: "#ffffff",
  OUTLINE_WEIGHT: 4,
  OUTLINE_OPACITY: 0.6,
  /** Very subtle background glow */
  GLOW_WEIGHT: 6,
  GLOW_OPACITY: 0.15,
  /** Dash pattern with longer gaps for label visibility */
  DASH_PATTERN: "10, 6", // Longer gaps = more label visibility
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
