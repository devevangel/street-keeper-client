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

/** Polyline colors: match design tokens (success/warning) for consistency. */
const COLOR_COMPLETED = "#16a34a";
const COLOR_PARTIAL = "#ca8a04";
/** Uncovered portion of partial streets (full street extent not yet run). */
const COLOR_UNCOVERED = "#9ca3af";

/** Stroke width: completed stands out more. */
const WEIGHT_COMPLETED = 5;
const WEIGHT_PARTIAL = 3;

/** Opacity: completed solid, partial slightly transparent. */
const OPACITY_COMPLETED = 1;
const OPACITY_PARTIAL = 0.7;

/** Dash pattern for in-progress streets (dash length, gap length in px). */
const DASH_PARTIAL = "8, 6";
/** Lighter dash for uncovered portion. */
const DASH_UNCOVERED = "4, 8";

interface StreetPolylineProps {
  /** Street data including geometry (GeoJSON LineString) and status. */
  street: MapStreet;
}

/**
 * Converts GeoJSON coordinates [lng, lat] to Leaflet [lat, lng].
 * Backend returns GeoJSON; Leaflet expects lat-first.
 */
function geoJsonToLeaflet(coordinates: [number, number][]): LatLngTuple[] {
  return coordinates.map(([lng, lat]) => [lat, lng] as LatLngTuple);
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

export function StreetPolyline({ street }: StreetPolylineProps) {
  const fullPositions = geoJsonToLeaflet(street.geometry.coordinates);
  const isCompleted = street.status === "completed";

  if (isCompleted) {
    return (
      <Polyline
        positions={fullPositions}
        pathOptions={{
          color: COLOR_COMPLETED,
          weight: WEIGHT_COMPLETED,
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
    return (
      <>
        <Polyline
          positions={fullPositions}
          pathOptions={{
            color: COLOR_UNCOVERED,
            weight: 2,
            opacity: 0.5,
            dashArray: DASH_UNCOVERED,
          }}
        />
        <Polyline
          positions={coveredPositions}
          pathOptions={{
            color: COLOR_PARTIAL,
            weight: WEIGHT_PARTIAL,
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

  return (
    <Polyline
      positions={fullPositions}
      pathOptions={{
        color: COLOR_PARTIAL,
        weight: WEIGHT_PARTIAL,
        opacity: OPACITY_PARTIAL,
        dashArray: DASH_PARTIAL,
      }}
    >
      <Popup>
        <PopupContent street={street} />
      </Popup>
    </Polyline>
  );
}
