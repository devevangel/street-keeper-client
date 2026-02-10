/**
 * ProjectMap
 * Map of project streets coloured by status: completed (green), partial (yellow), not started (grey).
 * Simplified to match home page MapView pattern.
 */

import { MapContainer, TileLayer, Polyline, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { ProjectMapData, ProjectMapStreet } from "../../types/api.types";

/** Colours by status (match design tokens where applicable) */
const COLOR_COMPLETED = "#16a34a";
const COLOR_PARTIAL = "#ca8a04";
const COLOR_NOT_RUN = "#9ca3af";
const COLOR_SUGGESTED = "#2563eb";

const WEIGHT = 4;
const WEIGHT_SUGGESTED = 5;
const OPACITY = 0.9;
const DASH_PARTIAL = "6, 6";
const DASH_NOT_RUN = "4, 8";

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
    ? COLOR_SUGGESTED
    : isCompleted
    ? COLOR_COMPLETED
    : isPartial
    ? COLOR_PARTIAL
    : COLOR_NOT_RUN;
  const pathOptions = {
    color,
    weight: isSuggested ? WEIGHT_SUGGESTED : WEIGHT,
    opacity: OPACITY,
    dashArray: isCompleted && !isSuggested
      ? undefined
      : isPartial && !isSuggested
      ? DASH_PARTIAL
      : !isSuggested
      ? DASH_NOT_RUN
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
          streets={mapData.streets}
          suggestedOsmIds={suggestedOsmIds}
        />
      </MapContainer>
      <div
        className="absolute bottom-4 left-4 z-[1000] rounded border-2 border-border bg-bg/95 px-3 py-2 text-xs shadow"
        aria-label="Map legend"
      >
        {showSuggestedLegend && (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-6 shrink-0 rounded"
              style={{ backgroundColor: COLOR_SUGGESTED }}
            />
            <span className="text-text">Suggested</span>
          </div>
        )}
        <div className={showSuggestedLegend ? "mt-1.5 flex items-center gap-2" : "flex items-center gap-2"}>
          <span
            className="inline-block h-1.5 w-6 shrink-0 rounded"
            style={{ backgroundColor: COLOR_COMPLETED }}
          />
          <span className="text-text">Completed</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="inline-block h-0 w-6 shrink-0 self-center border-b-2 border-[#ca8a04] opacity-90"
            style={{ borderStyle: "dashed" }}
          />
          <span className="text-text">Partial</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="inline-block h-0 w-6 shrink-0 self-center border-b-2 border-[#9ca3af] opacity-80"
            style={{ borderStyle: "dashed" }}
          />
          <span className="text-text">Not run</span>
        </div>
      </div>
    </div>
  );
}
