/**
 * StreetPolyline Component
 * Renders a single street's geometry on the map as a colored polyline.
 *
 * - Completed: single green solid line (full street).
 * - Partial with coveredGeometry: full street as grey dashed (underneath),
 *   covered portion as yellow solid (on top) so the user sees what's left to run.
 * - Partial without coveredGeometry (legacy): single yellow dashed line.
 */

import { Polyline, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { MapStreet } from "../../types/api.types";
import {
  MAP_COLORS,
  MAP_DASH,
  MAP_WEIGHTS,
  MAP_OPACITY,
  HIGHLIGHT_STYLE,
} from "./mapConstants";

/** Opacity for smoother appearance. */
const OPACITY_COMPLETED = 0.85;
const OPACITY_PARTIAL = 0.75;

interface StreetPolylineProps {
  /** Street data including geometry (GeoJSON LineString) and status. */
  street: MapStreet;
  /** When true, draw thicker and brighter (suggestion highlight). */
  highlight?: boolean;
}

/**
 * Converts GeoJSON coordinates [lng, lat] to Leaflet [lat, lng].
 * Backend returns GeoJSON; Leaflet expects lat-first.
 * Filters out any invalid coords to prevent Leaflet crashes.
 */
function geoJsonToLeaflet(coordinates: [number, number][]): LatLngTuple[] {
  return coordinates
    .filter(
      (c) =>
        Array.isArray(c) &&
        c.length >= 2 &&
        Number.isFinite(c[0]) &&
        Number.isFinite(c[1])
    )
    .map(([lng, lat]) => [lat, lng] as LatLngTuple);
}

const PopupContent = ({ street }: { street: MapStreet }) => {
  const statusLabel =
    street.status === "completed" ? "Completed" : "In progress";
  return (
    <div className="min-w-[140px] text-left text-neutral-800">
      <p className="font-bold text-neutral-900">{street.name}</p>
      <p className="text-sm text-neutral-600">
        {street.percentage.toFixed(0)}% · {statusLabel}
        {street.stats.runCount > 0 &&
          ` · ${street.stats.runCount} run${street.stats.runCount !== 1 ? "s" : ""}`}
      </p>
    </div>
  );
};

const PATH_OPTIONS_BASE = {
  lineCap: "round" as const,
  lineJoin: "round" as const,
  pane: "streetPane",
};

export function StreetPolyline({ street, highlight = false }: StreetPolylineProps) {
  // Guard: skip if geometry is missing or empty (prevents Leaflet crash)
  if (
    !street.geometry?.coordinates ||
    street.geometry.coordinates.length < 2
  ) {
    return null;
  }

  const fullPositions = geoJsonToLeaflet(street.geometry.coordinates);

  // Guard: ensure at least 2 valid positions after conversion
  if (fullPositions.length < 2) {
    return null;
  }

  const isCompleted = street.status === "completed";

  if (highlight) {
    // Multi-layer highlight approach to maximize label visibility:
    // 1. Very subtle glow background (provides soft highlight)
    // 2. White outline/halo (creates contrast, makes labels pop)
    // 3. Ultra-thin dashed colored line (minimal coverage, gaps show labels)
    return (
      <>
        {/* Layer 1: Very subtle glow background */}
        <Polyline
          positions={fullPositions}
          pathOptions={{
            ...PATH_OPTIONS_BASE,
            color: MAP_COLORS.HIGHLIGHT,
            weight: HIGHLIGHT_STYLE.GLOW_WEIGHT,
            opacity: HIGHLIGHT_STYLE.GLOW_OPACITY,
          }}
        />
        {/* Layer 2: White outline/halo - creates contrast and makes labels readable */}
        <Polyline
          positions={fullPositions}
          pathOptions={{
            ...PATH_OPTIONS_BASE,
            color: HIGHLIGHT_STYLE.OUTLINE_COLOR,
            weight: HIGHLIGHT_STYLE.OUTLINE_WEIGHT,
            opacity: HIGHLIGHT_STYLE.OUTLINE_OPACITY,
            dashArray: HIGHLIGHT_STYLE.DASH_PATTERN,
          }}
        />
        {/* Layer 3: Ultra-thin colored dashed line - minimal coverage, gaps show labels */}
        <Polyline
          positions={fullPositions}
          pathOptions={{
            ...PATH_OPTIONS_BASE,
            color: MAP_COLORS.HIGHLIGHT,
            weight: MAP_WEIGHTS.HIGHLIGHT,
            opacity: MAP_OPACITY.HIGHLIGHT,
            dashArray: HIGHLIGHT_STYLE.DASH_PATTERN, // Longer gaps = more label visibility
          }}
        >
          <Popup>
            <PopupContent street={street} />
          </Popup>
        </Polyline>
      </>
    );
  }

  if (isCompleted) {
    return (
      <Polyline
        positions={fullPositions}
        pathOptions={{
          ...PATH_OPTIONS_BASE,
          color: MAP_COLORS.COMPLETED,
          weight: MAP_WEIGHTS.DEFAULT,
          opacity: OPACITY_COMPLETED,
        }}
      >
        <Popup>
          <PopupContent street={street} />
        </Popup>
      </Polyline>
    );
  }

  const hasCoveredGeometry =
    street.coveredGeometry?.coordinates?.length;

  if (hasCoveredGeometry && street.coveredGeometry) {
    const coveredPositions = geoJsonToLeaflet(
      street.coveredGeometry.coordinates
    );
    // Only render covered polyline if it has at least 2 valid positions
    if (coveredPositions.length >= 2) {
      return (
        <>
          <Polyline
            positions={fullPositions}
            pathOptions={{
              ...PATH_OPTIONS_BASE,
              color: MAP_COLORS.UNCOVERED,
              weight: 2,
              opacity: 0.4,
              dashArray: MAP_DASH.UNCOVERED,
            }}
          />
          <Polyline
            positions={coveredPositions}
            pathOptions={{
              ...PATH_OPTIONS_BASE,
              color: MAP_COLORS.PARTIAL,
              weight: MAP_WEIGHTS.DEFAULT,
              opacity: OPACITY_PARTIAL,
            }}
          >
            <Popup>
              <PopupContent street={street} />
            </Popup>
          </Polyline>
        </>
      );
    }
  }

  return (
    <Polyline
      positions={fullPositions}
      pathOptions={{
        ...PATH_OPTIONS_BASE,
        color: MAP_COLORS.PARTIAL,
        weight: MAP_WEIGHTS.DEFAULT,
        opacity: OPACITY_PARTIAL,
        dashArray: MAP_DASH.PARTIAL,
      }}
    >
      <Popup>
        <PopupContent street={street} />
      </Popup>
    </Polyline>
  );
}
