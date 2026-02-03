/**
 * MapView Component
 * Interactive Leaflet map showing user location and street polylines (completed = green, partial = yellow).
 * Uses OpenStreetMap tiles. Renders inside a fixed-height container so the map initializes correctly.
 */

import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { MapStreet } from "../../types/api.types";
import { LocationMarker } from "./LocationMarker";
import { StreetLayer } from "./StreetLayer";

/** Default center when position is not yet available (e.g. UK). */
const DEFAULT_CENTER: LatLngTuple = [50, -1];

/** Zoom when centered on user. 19 is OpenStreetMap’s max tile zoom – any higher looks blurry. */
const ZOOM_USER = 19;

/** Zoom when using default center. */
const ZOOM_DEFAULT = 10;

interface MapViewProps {
  /** User's current position. Map centers here when set; otherwise uses DEFAULT_CENTER. */
  position: { lat: number; lng: number } | null;
  /** Streets from GET /map/streets to draw as polylines. */
  streets: MapStreet[];
  /** Optional CSS class for the wrapper div (e.g. height). Defaults to h-[65vh] min-h-[400px] w-full. */
  className?: string;
}

export function MapView({
  position,
  streets,
  className = "h-[65vh] min-h-[400px] w-full",
}: MapViewProps) {
  const center: LatLngTuple = position
    ? [position.lat, position.lng]
    : DEFAULT_CENTER;
  const zoom = position ? ZOOM_USER : ZOOM_DEFAULT;

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        maxZoom={19}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <LocationMarker position={position} />
        <StreetLayer streets={streets} />
      </MapContainer>
    </div>
  );
}
