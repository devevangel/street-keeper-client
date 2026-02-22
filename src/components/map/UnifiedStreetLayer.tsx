/**
 * UnifiedStreetLayer – Renders streets from either home map (MapStreet) or project map (ProjectMapStreet).
 * Normalizes both to a common shape and uses a single polyline component.
 */

import { Polyline, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { MapStreet, ProjectMapStreet } from "../../types/api.types";
import {
  MAP_COLORS,
  MAP_DASH,
  MAP_WEIGHTS,
} from "./mapConstants";
import { getStreetBin, type FilterStatus } from "../../utils/street-filters";

const OPACITY = 0.85;
const OPACITY_PARTIAL = 0.75;

/** Normalized street for rendering (common fields from MapStreet and ProjectMapStreet) */
export interface UnifiedStreetItem {
  osmId: string;
  name: string;
  status: "completed" | "partial" | "not_started";
  geometry: { type: "LineString"; coordinates: [number, number][] };
  percentage: number;
  coveredGeometry?: { type: "LineString"; coordinates: [number, number][] };
  /** When present, popup shows run count */
  runCount?: number;
}

function toUnified(item: MapStreet | ProjectMapStreet): UnifiedStreetItem {
  if ("stats" in item) {
    const s = item as MapStreet;
    return {
      osmId: s.osmId,
      name: s.name,
      status: s.status,
      geometry: s.geometry,
      percentage: s.percentage,
      coveredGeometry: s.coveredGeometry,
      runCount: s.stats.runCount,
    };
  }
  const p = item as ProjectMapStreet;
  return {
    osmId: p.osmId,
    name: p.name,
    status: p.status,
    geometry: p.geometry,
    percentage: p.percentage,
    runCount: undefined,
  };
}

function geoJsonToLeaflet(coords: [number, number][]): LatLngTuple[] {
  return coords
    .filter(
      (c) =>
        Array.isArray(c) &&
        c.length >= 2 &&
        Number.isFinite(c[0]) &&
        Number.isFinite(c[1])
    )
    .map(([lng, lat]) => [lat, lng] as LatLngTuple);
}

const PATH_OPTIONS_BASE = {
  lineCap: "round" as const,
  lineJoin: "round" as const,
  pane: "streetPane",
};

function UnifiedStreetPolyline({
  street,
  highlight,
}: {
  street: UnifiedStreetItem;
  highlight: boolean;
}) {
  // Guard: skip if geometry is missing or empty (prevents Leaflet crash)
  if (
    !street.geometry?.coordinates ||
    street.geometry.coordinates.length < 2
  ) {
    return null;
  }

  const fullPositions = geoJsonToLeaflet(street.geometry.coordinates);

  // Guard: ensure at least 2 valid positions after conversion
  if (fullPositions.length < 2) {
    return null;
  }

  const completed = street.status === "completed";
  const bin: FilterStatus = getStreetBin(street.percentage ?? 0, completed);

  const BIN_LABELS: Record<FilterStatus, string> = {
    all: "All",
    completed: "Completed",
    almostThere: "Almost there",
    inProgress: "In progress",
    notStarted: "Not started",
  };
  const statusLabel = BIN_LABELS[bin];

  if (highlight) {
    return (
      <Polyline
        positions={fullPositions}
        pathOptions={{
          ...PATH_OPTIONS_BASE,
          color: MAP_COLORS.HIGHLIGHT,
          weight: MAP_WEIGHTS.HIGHLIGHT,
          opacity: 0.9,
        }}
      >
        <Popup>
          <div className="min-w-[140px] text-left text-neutral-800">
            <p className="font-bold text-neutral-900">{street.name}</p>
            <p className="text-sm text-neutral-600">
              {street.percentage.toFixed(0)}% · {statusLabel}
              {street.runCount != null &&
                street.runCount > 0 &&
                ` · ${street.runCount} run${street.runCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        </Popup>
      </Polyline>
    );
  }

  if (bin === "notStarted") {
    return (
      <Polyline
        positions={fullPositions}
        pathOptions={{
          ...PATH_OPTIONS_BASE,
          color: MAP_COLORS.NOT_RUN,
          weight: MAP_WEIGHTS.DEFAULT,
          opacity: OPACITY,
          dashArray: MAP_DASH.NOT_RUN,
        }}
      >
        <Popup>
          <div className="min-w-[140px] text-left text-neutral-800">
            <p className="font-bold text-neutral-900">{street.name}</p>
            <p className="text-sm text-neutral-600">
              {street.percentage.toFixed(0)}% · {statusLabel}
            </p>
          </div>
        </Popup>
      </Polyline>
    );
  }

  if (bin === "completed") {
    return (
      <Polyline
        positions={fullPositions}
        pathOptions={{
          ...PATH_OPTIONS_BASE,
          color: MAP_COLORS.COMPLETED,
          weight: MAP_WEIGHTS.DEFAULT,
          opacity: OPACITY,
        }}
      >
        <Popup>
          <div className="min-w-[140px] text-left text-neutral-800">
            <p className="font-bold text-neutral-900">{street.name}</p>
            <p className="text-sm text-neutral-600">
              {street.percentage.toFixed(0)}% · {statusLabel}
              {street.runCount != null &&
                street.runCount > 0 &&
                ` · ${street.runCount} run${street.runCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        </Popup>
      </Polyline>
    );
  }

  const polyColor = bin === "almostThere" ? MAP_COLORS.ALMOST_THERE : MAP_COLORS.IN_PROGRESS;
  const polyDash = bin === "almostThere" ? MAP_DASH.ALMOST_THERE : MAP_DASH.IN_PROGRESS;

  const hasCoveredGeometry = street.coveredGeometry?.coordinates?.length;
  if (hasCoveredGeometry && street.coveredGeometry) {
    const coveredPositions = geoJsonToLeaflet(street.coveredGeometry.coordinates);
    // Only render covered polyline if it has at least 2 valid positions
    if (coveredPositions.length >= 2) {
      return (
        <>
          <Polyline
            positions={fullPositions}
            pathOptions={{
              ...PATH_OPTIONS_BASE,
              color: MAP_COLORS.UNCOVERED,
              weight: 2,
              opacity: 0.4,
              dashArray: MAP_DASH.UNCOVERED,
            }}
          />
          <Polyline
            positions={coveredPositions}
            pathOptions={{
              ...PATH_OPTIONS_BASE,
              color: polyColor,
              weight: MAP_WEIGHTS.DEFAULT,
              opacity: OPACITY_PARTIAL,
            }}
          >
            <Popup>
              <div className="min-w-[140px] text-left text-neutral-800">
                <p className="font-bold text-neutral-900">{street.name}</p>
                <p className="text-sm text-neutral-600">
                  {street.percentage.toFixed(0)}% · {statusLabel}
                  {street.runCount != null &&
                    street.runCount > 0 &&
                    ` · ${street.runCount} run${street.runCount !== 1 ? "s" : ""}`}
                </p>
              </div>
            </Popup>
          </Polyline>
        </>
      );
    }
  }

  return (
    <Polyline
      positions={fullPositions}
      pathOptions={{
        ...PATH_OPTIONS_BASE,
        color: polyColor,
        weight: MAP_WEIGHTS.DEFAULT,
        opacity: OPACITY_PARTIAL,
        dashArray: polyDash,
      }}
    >
      <Popup>
        <div className="min-w-[140px] text-left text-neutral-800">
          <p className="font-bold text-neutral-900">{street.name}</p>
          <p className="text-sm text-neutral-600">
            {street.percentage.toFixed(0)}% · {statusLabel}
            {street.runCount != null &&
              street.runCount > 0 &&
              ` · ${street.runCount} run${street.runCount !== 1 ? "s" : ""}`}
          </p>
        </div>
      </Popup>
    </Polyline>
  );
}

export interface UnifiedStreetLayerProps {
  streets: (MapStreet | ProjectMapStreet)[];
  highlightOsmIds?: string[];
}

export function UnifiedStreetLayer({
  streets,
  highlightOsmIds = [],
}: UnifiedStreetLayerProps) {
  if (!streets.length) return null;
  const highlightSet = new Set(highlightOsmIds);
  const normalized = streets.map(toUnified);

  return (
    <>
      {normalized.map((street) => (
        <UnifiedStreetPolyline
          key={street.osmId}
          street={street}
          highlight={highlightSet.has(street.osmId)}
        />
      ))}
    </>
  );
}
