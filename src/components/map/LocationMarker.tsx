/**
 * LocationMarker Component
 * Renders the user's current position with a distinct "You are here" marker and popup.
 * Used inside MapContainer; returns null when position is not available.
 */

import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";

interface LocationMarkerProps {
  /** User's current position (lat/lng). Omit or pass null to hide the marker. */
  position: { lat: number; lng: number } | null;
}

/** Google Maps–style “blue dot”: solid blue center, white ring, soft blue halo. */
const USER_MARKER_HTML = `
  <div class="street-keeper-user-marker" aria-hidden="true">
    <span class="street-keeper-user-marker__halo"></span>
    <span class="street-keeper-user-marker__ring"></span>
    <span class="street-keeper-user-marker__dot"></span>
  </div>
`;

const userIcon = L.divIcon({
  html: USER_MARKER_HTML,
  className: "street-keeper-user-marker-wrapper",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export function LocationMarker({ position }: LocationMarkerProps) {
  if (!position) return null;

  const center: LatLngTuple = [position.lat, position.lng];

  return (
    <Marker position={center} icon={userIcon}>
      <Popup>
        <span className="text-neutral-900 font-medium">Your location</span>
      </Popup>
    </Marker>
  );
}
