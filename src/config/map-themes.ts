/**
 * Map Themes Configuration
 *
 * Each theme references a Mapbox style via its style ID.
 * Tile URL pattern: https://api.mapbox.com/styles/v1/{styleId}/tiles/512/{z}/{x}/{y}@2x?access_token={token}
 *
 * To add a new theme: add an entry here with a unique `id`, a Mapbox `styleId`,
 * and optional metadata. The rest of the app picks it up automatically.
 */

export interface MapTheme {
  /** Unique key stored in user preferences */
  id: string;
  /** Display name shown in the picker */
  label: string;
  /** Short description */
  description: string;
  /** Mapbox style path (e.g. "mapbox/outdoors-v12") */
  styleId: string;
  /** Preview swatch colors (background + accent) for the selector UI */
  preview: { bg: string; accent: string; text: string };
}

/**
 * Available map themes.
 * The first entry is the default when no preference is set.
 */
export const MAP_THEMES: MapTheme[] = [
  {
    id: "standard",
    label: "Standard",
    description: "Custom Street Keeper theme — clean and readable",
    styleId: "devvvangel/cmm8n5snz00cr01qwh0frh6r2",
    preview: { bg: "#e8e0d8", accent: "#4a9e5c", text: "#333" },
  },
  {
    id: "outdoors",
    label: "Outdoors",
    description: "Terrain, trails & outdoor focus — closest to Strava",
    styleId: "mapbox/outdoors-v12",
    preview: { bg: "#d5cfc5", accent: "#4a9e5c", text: "#333" },
  },
  {
    id: "streets",
    label: "Streets",
    description: "Clean, detailed street map",
    styleId: "mapbox/streets-v12",
    preview: { bg: "#f0ede8", accent: "#4264fb", text: "#333" },
  },
  {
    id: "light",
    label: "Light",
    description: "Minimal light background — lets your data stand out",
    styleId: "mapbox/light-v11",
    preview: { bg: "#f8f8f8", accent: "#aaa", text: "#333" },
  },
  {
    id: "dark",
    label: "Dark",
    description: "Dark background — easier on the eyes at night",
    styleId: "mapbox/dark-v11",
    preview: { bg: "#1a1a2e", accent: "#6a6a8a", text: "#eee" },
  },
  {
    id: "satellite",
    label: "Satellite",
    description: "Aerial imagery with street labels",
    styleId: "mapbox/satellite-streets-v12",
    preview: { bg: "#1b3a1b", accent: "#5b8a3c", text: "#fff" },
  },
];

export const DEFAULT_MAP_THEME = MAP_THEMES[0].id;

export function getMapTheme(themeId: string | undefined | null): MapTheme {
  return MAP_THEMES.find((t) => t.id === themeId) ?? MAP_THEMES[0];
}

/**
 * Build tile URLs for base + optional labels-only overlay.
 *
 * - No Mapbox token: Carto "nolabels" base plus Carto labels-only in
 *   labelsPane so names sit above our polylines (no duplicate text).
 * - Mapbox: full style tiles only (they already include labels). Do not stack
 *   Carto labels on top — that duplicated every street name.
 */
export function getMapTileUrls(theme: MapTheme): {
  base: string;
  labels: string;
  isMapbox: boolean;
} {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  const labelsUrl =
    theme.id === "dark" || theme.id === "satellite"
      ? "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png";

  if (!token) {
    const baseUrl =
      theme.id === "dark"
        ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
    return { base: baseUrl, labels: labelsUrl, isMapbox: false };
  }

  return {
    base: `https://api.mapbox.com/styles/v1/${theme.styleId}/tiles/512/{z}/{x}/{y}@2x?access_token=${token}`,
    labels: labelsUrl,
    isMapbox: true,
  };
}

/** @deprecated Use getMapTileUrls instead */
export function getMapTileUrl(theme: MapTheme): string {
  return getMapTileUrls(theme).base;
}

/** Attribution string (Mapbox/Carto/OSM as appropriate) */
export function getMapAttribution(theme: MapTheme): string {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  if (!token) {
    if (theme.id === "dark") {
      return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
    }
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  }
  return '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
}
