/**
 * StreetLayer Component
 * Renders all street polylines on the map. Used inside MapContainer.
 * When streets is empty, renders nothing (map still shows user location).
 */

import type { MapStreet } from "../../types/api.types";
import { StreetPolyline } from "./StreetPolyline";
import { normalizeOsmId } from "../../utils/map-utils";

interface StreetLayerProps {
  /** Streets from GET /map/streets. Each is drawn as a colored polyline. */
  streets: MapStreet[];
  /** OSM IDs (string) to highlight (thicker + brighter). */
  highlightOsmIds?: string[];
}

export function StreetLayer({ streets, highlightOsmIds }: StreetLayerProps) {
  if (!streets.length) return null;
  // Normalize osmIds for consistent comparison (handles "way/123" vs "123" format differences)
  const set = new Set((highlightOsmIds ?? []).map(normalizeOsmId));

  return (
    <>
      {streets.map((street) => (
        <StreetPolyline
          key={street.osmId}
          street={street}
          highlight={set.has(normalizeOsmId(street.osmId))}
        />
      ))}
    </>
  );
}
