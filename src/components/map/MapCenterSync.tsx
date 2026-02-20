/**
 * Syncs the map view only when jumping to a new place (search / user location).
 * Does not run on first mount. Only triggers flyTo if distance >= threshold.
 */

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { LatLngTuple } from "leaflet";

const FLY_TO_THRESHOLD_M = 50;

function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export interface MapCenterSyncProps {
  center: LatLngTuple;
  zoom: number;
}

export function MapCenterSync({ center, zoom }: MapCenterSyncProps) {
  const map = useMap();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const current = map.getCenter();
    const target = { lat: center[0], lng: center[1] };
    const dist = distanceMeters(target, { lat: current.lat, lng: current.lng });
    if (dist >= FLY_TO_THRESHOLD_M) {
      map.flyTo(center, zoom, { duration: 0.5 });
    }
  }, [map, center[0], center[1], zoom]);

  return null;
}
