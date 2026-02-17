/**
 * ProjectMap
 * Map of project streets coloured by status: completed (green), partial (yellow), not started (grey).
 * Simplified to match home page MapView pattern.
 */

import { useCallback, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { ProjectMapData, ProjectMapStreet } from "../../types/api.types";
import {
  MAP_COLORS,
  MAP_DASH,
  MAP_WEIGHTS,
} from "../map/mapConstants";
import { MapLegendFilter, type StreetStatus } from "../map";

const OPACITY = 0.9;

function geoJsonToLeaflet(coords: [number, number][]): LatLngTuple[] {
  return coords.map(([lng, lat]) => [lat, lng] as LatLngTuple);
}

function ProjectStreetPolyline({
  street,
  isSuggested,
}: {
  street: ProjectMapStreet;
  isSuggested: boolean;
}) {
  const positions = geoJsonToLeaflet(street.geometry.coordinates);
  const isCompleted = street.status === "completed";
  const isPartial = street.status === "partial";
  const color = isSuggested
    ? MAP_COLORS.HIGHLIGHT
    : isCompleted
    ? MAP_COLORS.COMPLETED
    : isPartial
    ? MAP_COLORS.PARTIAL
    : MAP_COLORS.NOT_RUN;
  const pathOptions = {
    color,
    weight: isSuggested ? MAP_WEIGHTS.HIGHLIGHT : MAP_WEIGHTS.DEFAULT,
    opacity: OPACITY,
    dashArray: isCompleted && !isSuggested
      ? undefined
      : isPartial && !isSuggested
      ? MAP_DASH.PARTIAL
      : !isSuggested
      ? MAP_DASH.NOT_RUN
      : undefined,
  };

  return (
    <Polyline positions={positions} pathOptions={pathOptions}>
      <Popup>
        <div className="min-w-[140px] text-left text-neutral-800">
          <p className="font-bold text-neutral-900">{street.name}</p>
          <p className="text-sm text-neutral-600">
            {street.percentage.toFixed(0)}% · {street.status.replace("_", " ")}
            {isSuggested && " · Suggested"}
          </p>
        </div>
      </Popup>
    </Polyline>
  );
}

function ProjectStreetLayer({
  streets,
  suggestedOsmIds,
}: {
  streets: ProjectMapStreet[];
  suggestedOsmIds?: Set<string>;
}) {
  if (!streets.length) return null;
  return (
    <>
      {streets.map((street) => (
        <ProjectStreetPolyline
          key={street.osmId}
          street={street}
          isSuggested={suggestedOsmIds?.has(street.osmId) ?? false}
        />
      ))}
    </>
  );
}

export interface ProjectMapProps {
  /** Map data from GET /projects/:id/map */
  mapData: ProjectMapData;
  /** Optional class for wrapper (e.g. height) */
  className?: string;
  /** Optional set of OSM street IDs to highlight as suggested (blue) */
  suggestedOsmIds?: Set<string>;
  /** When true, show "Suggested" in legend */
  showSuggestedLegend?: boolean;
}

const DEFAULT_ZOOM = 14;

export function ProjectMap({
  mapData,
  className = "h-[65vh] min-h-[400px] w-full",
  suggestedOsmIds,
  showSuggestedLegend = false,
}: ProjectMapProps) {
  const [visibleStatuses, setVisibleStatuses] = useState<Set<StreetStatus>>(
    () => new Set(["completed", "partial", "not_started"])
  );

  const handleToggleStatus = useCallback((status: StreetStatus) => {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const filteredStreets = useMemo(
    () =>
      mapData.streets.filter((s) =>
        visibleStatuses.has(s.status as StreetStatus)
      ),
    [mapData.streets, visibleStatuses]
  );

  const center: LatLngTuple = [
    mapData.boundary.center.lat,
    mapData.boundary.center.lng,
  ];

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        maxZoom={19}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ProjectStreetLayer
          streets={filteredStreets}
          suggestedOsmIds={suggestedOsmIds}
        />
      </MapContainer>
      <div
        className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2"
        aria-label="Map legend"
      >
        {showSuggestedLegend && (
          <div className="flex items-center gap-2 rounded border-2 border-border bg-bg/95 px-3 py-2 text-xs shadow">
            <span
              className="inline-block h-1.5 w-6 shrink-0 rounded"
              style={{ backgroundColor: MAP_COLORS.HIGHLIGHT }}
            />
            <span className="text-text">Suggested</span>
          </div>
        )}
        <MapLegendFilter
          visibleStatuses={visibleStatuses}
          onToggle={handleToggleStatus}
          availableStatuses={["completed", "partial", "not_started"]}
        />
      </div>
    </div>
  );
}
