/**
 * StreetPolyline Component
 * Renders a single street's geometry on the map as a colored polyline.
 * Green = completed (ever reached ~90%), yellow = partial. Includes a popup with name, percentage, run count.
 */

import { Polyline, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { MapStreet } from "../../types/api.types";

/** Polyline colors: match design tokens (success/warning) for consistency. */
const COLOR_COMPLETED = "#16a34a";
const COLOR_PARTIAL = "#ca8a04";

/** Stroke width: completed stands out more. */
const WEIGHT_COMPLETED = 5;
const WEIGHT_PARTIAL = 3;

/** Opacity: completed solid, partial slightly transparent. */
const OPACITY_COMPLETED = 1;
const OPACITY_PARTIAL = 0.7;

/** Dash pattern for in-progress streets (dash length, gap length in px). */
const DASH_PARTIAL = "8, 6";

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

export function StreetPolyline({ street }: StreetPolylineProps) {
  const positions = geoJsonToLeaflet(street.geometry.coordinates);
  const isCompleted = street.status === "completed";

  const pathOptions = {
    color: isCompleted ? COLOR_COMPLETED : COLOR_PARTIAL,
    weight: isCompleted ? WEIGHT_COMPLETED : WEIGHT_PARTIAL,
    opacity: isCompleted ? OPACITY_COMPLETED : OPACITY_PARTIAL,
    dashArray: isCompleted ? undefined : DASH_PARTIAL,
  };

  return (
    <Polyline positions={positions} pathOptions={pathOptions}>
      <Popup>
        <div className="min-w-[140px] text-left text-neutral-800">
          <p className="font-bold text-neutral-900">{street.name}</p>
          <p className="text-sm text-neutral-600">
            {street.percentage.toFixed(0)}% · {street.stats.runCount} run
            {street.stats.runCount !== 1 ? "s" : ""}
          </p>
        </div>
      </Popup>
    </Polyline>
  );
}
