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

/** Default stroke width in pixels. */
const WEIGHT = 4;

/** Opacity for the stroke. */
const OPACITY = 0.9;

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
  const color = street.status === "completed" ? COLOR_COMPLETED : COLOR_PARTIAL;

  const pathOptions = {
    color,
    weight: WEIGHT,
    opacity: OPACITY,
  };

  return (
    <Polyline positions={positions} pathOptions={pathOptions}>
      <Popup>
        <div className="min-w-[140px] text-left">
          <p className="font-bold text-text">{street.name}</p>
          <p className="text-sm text-text-muted">
            {street.percentage.toFixed(0)}% · {street.stats.runCount} run
            {street.stats.runCount !== 1 ? "s" : ""}
          </p>
        </div>
      </Popup>
    </Polyline>
  );
}
