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
  /** OSM IDs (string) to highlight (thicker + brighter). */
  highlightOsmIds?: string[];
}

export function StreetLayer({ streets, highlightOsmIds }: StreetLayerProps) {
  if (!streets.length) return null;
  const set = new Set(highlightOsmIds ?? []);

  return (
    <>
      {streets.map((street) => (
        <StreetPolyline
          key={street.osmId}
          street={street}
          highlight={set.has(street.osmId)}
        />
      ))}
    </>
  );
}
