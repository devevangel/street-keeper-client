/**
 * StreetList Component
 * Renders a list of streets with status indicators (green = completed, yellow = partial).
 * Each street is a StreetCard; one can be expanded to show stats.
 */

import type { MapStreet } from "../../types/api.types";
import { StreetCard } from "./StreetCard";

interface StreetListProps {
  /** Streets to display */
  streets: MapStreet[];
  /** OSM ID of the street currently expanded (or null) */
  expandedOsmId: string | null;
  /** Called when user toggles a street's expanded state */
  onToggleExpand: (osmId: string) => void;
}

export function StreetList({
  streets,
  expandedOsmId,
  onToggleExpand,
}: StreetListProps) {
  return (
    <ul className="list-none space-y-2 p-0" aria-label="Streets you have run">
      {streets.map((street) => (
        <StreetCard
          key={street.osmId}
          street={street}
          isExpanded={expandedOsmId === street.osmId}
          onToggle={() => onToggleExpand(street.osmId)}
        />
      ))}
    </ul>
  );
}
