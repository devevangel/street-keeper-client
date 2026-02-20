/**
 * Handles map click events when enabled (e.g. for placing circle center).
 */

import { useMapEvents } from "react-leaflet";

export interface MapClickHandlerProps {
  enabled: boolean;
  onMapClick: (point: { lat: number; lng: number }) => void;
}

export function MapClickHandler({ enabled, onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      if (enabled) onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}
