/**
 * When bbox is set, fit map to that bounds once (e.g. "View area on map").
 * Uses stable default values to avoid re-firing on every render.
 */

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { LatLngTuple } from "leaflet";

export interface FitBoundsToHighlightProps {
  bbox: [number, number, number, number];
}

const FIT_PADDING: [number, number] = [50, 50];
const FIT_MAX_ZOOM = 17;

export function FitBoundsToHighlight({ bbox }: FitBoundsToHighlightProps) {
  const map = useMap();
  const fittedRef = useRef<string | null>(null);

  useEffect(() => {
    const [minLat, minLng, maxLat, maxLng] = bbox;
    if (
      !Number.isFinite(minLat) ||
      !Number.isFinite(minLng) ||
      !Number.isFinite(maxLat) ||
      !Number.isFinite(maxLng)
    ) {
      return;
    }

    const key = `${minLat},${minLng},${maxLat},${maxLng}`;
    if (fittedRef.current === key) return;
    fittedRef.current = key;

    map.fitBounds(
      [
        [minLat, minLng],
        [maxLat, maxLng],
      ] as LatLngTuple[],
      { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, animate: true },
    );
  }, [map, bbox[0], bbox[1], bbox[2], bbox[3]]);

  return null;
}
