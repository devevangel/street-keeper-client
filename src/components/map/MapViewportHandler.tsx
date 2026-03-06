/**
 * Handles map viewport change (pan/zoom) with debouncing.
 * Calls onViewportChange with new center when user stops moving the map.
 */

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

const PAN_DEBOUNCE_MS = 600;

export interface MapViewportHandlerProps {
  onViewportChange: (center: { lat: number; lng: number }) => void;
}

export function MapViewportHandler({ onViewportChange }: MapViewportHandlerProps) {
  const map = useMap();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const c = map.getCenter();
        onViewportChange({ lat: c.lat, lng: c.lng });
        debounceRef.current = null;
      }, PAN_DEBOUNCE_MS);
    };
    map.on("moveend", handler);
    return () => {
      map.off("moveend", handler);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [map, onViewportChange]);

  return null;
}
