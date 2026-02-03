/**
 * StreetLayer Component
 * Renders all street polylines on the map. Used inside MapContainer.
 * When streets is empty, renders nothing (map still shows user location).
 */

import type { MapStreet } from "../../types/api.types";
import { StreetPolyline } from "./StreetPolyline";

interface StreetLayerProps {
  /** Streets from GET /map/streets. Each is drawn as a colored polyline. */
  streets: MapStreet[];
}

export function StreetLayer({ streets }: StreetLayerProps) {
  if (!streets.length) return null;

  return (
    <>
      {streets.map((street) => (
        <StreetPolyline key={street.osmId} street={street} />
      ))}
    </>
  );
}
