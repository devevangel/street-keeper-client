/**
 * When bbox is set, fit map to that bounds (e.g. "Show on map" for street highlight).
 */

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { LatLngTuple } from "leaflet";

export interface FitBoundsToHighlightProps {
  bbox: [number, number, number, number];
  /** Optional padding [top, right, bottom, left] or [y, x]. Default [20, 20]. */
  padding?: [number, number];
  /** Optional max zoom when fitting. Default 18. */
  maxZoom?: number;
}

export function FitBoundsToHighlight({
  bbox,
  padding = [50, 50],
  maxZoom = 17,
}: FitBoundsToHighlightProps) {
  const map = useMap();
  useEffect(() => {
    const [minLat, minLng, maxLat, maxLng] = bbox;
    // Validate bbox values to prevent Leaflet errors
    if (
      !Number.isFinite(minLat) ||
      !Number.isFinite(minLng) ||
      !Number.isFinite(maxLat) ||
      !Number.isFinite(maxLng)
    ) {
      return;
    }
    map.fitBounds(
      [
        [minLat, minLng],
        [maxLat, maxLng],
      ] as LatLngTuple[],
      { padding, maxZoom, animate: true }
    );
  }, [map, bbox[0], bbox[1], bbox[2], bbox[3], padding, maxZoom]);
  return null;
}
