/**
 * Application Constants
 * Centralized configuration values.
 */

export const API = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",
} as const;

/** GPX analysis engine: "v1" (runs/analyze-gpx) or "v2" (engine-v2/analyze). Default v1. */
export const GPX_ENGINE = (import.meta.env.VITE_GPX_ENGINE ?? "v1") as "v1" | "v2";

/** Default project radius (meters) used when creating a project or setting preferences. */
export const DEFAULT_PROJECT_RADIUS_METERS = 300;

/** App route paths. Used by React Router and navigation. */
export const ROUTES = {
  /** Public landing page (unauthenticated). Authenticated users are redirected to HOME. */
  LANDING: "/",
  /** Authenticated app home. */
  HOME: "/home",
  LOGIN: "/login",
  AUTH_CALLBACK: "/auth/callback",
  PROJECTS_LIST: "/projects",
  PROJECT_DETAIL: "/projects/:id",
  PROJECT_SUGGESTIONS: "/projects/:id/suggestions",
  CAMPAIGN: "/campaign",
  MILESTONES: "/milestones",
  PREFERENCES: "/preferences",
  ACTIVITIES: "/activities",
  GPX_UPLOAD: "/gpx",
  DOCS: "/docs",
  DOCS_PAGE: "/docs/:slug",
} as const;

/**
 * Error codes returned by the API (subset used by frontend).
 * See backend docs/ERROR_REFERENCE.md for full list.
 */
export const ERROR_CODES = {
  AUTH_DENIED: "AUTH_DENIED",
  AUTH_MISSING_CODE: "AUTH_MISSING_CODE",
  AUTH_INVALID_CODE: "AUTH_INVALID_CODE",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_CONFIG_ERROR: "AUTH_CONFIG_ERROR",
  AUTH_REQUIRED: "AUTH_REQUIRED",
  PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",
  PROJECT_INVALID_RADIUS: "PROJECT_INVALID_RADIUS",
  PROJECT_NO_STREETS: "PROJECT_NO_STREETS",
  PROJECT_ACCESS_DENIED: "PROJECT_ACCESS_DENIED",
  ACTIVITY_NOT_FOUND: "ACTIVITY_NOT_FOUND",
  GPX_FILE_REQUIRED: "GPX_FILE_REQUIRED",
  GPX_PARSE_ERROR: "GPX_PARSE_ERROR",
  GPX_FILE_TOO_LARGE: "GPX_FILE_TOO_LARGE",
  OVERPASS_API_ERROR: "OVERPASS_API_ERROR",
  MAPBOX_API_ERROR: "MAPBOX_API_ERROR",
  STRAVA_API_ERROR: "STRAVA_API_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  MAP_INVALID_COORDINATES: "MAP_INVALID_COORDINATES",
  MAP_RADIUS_TOO_LARGE: "MAP_RADIUS_TOO_LARGE",
} as const;
