/**
 * ProjectMapPage
 * Project-scoped map: streets coloured by status (completed / partial / not run).
 * Street list sidebar with hover/click to highlight and jump to street (like homepage).
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, Card } from "../components/common";
import { StreetListItem, type StreetListItemData } from "../components/common";
import { UnifiedMap } from "../components/map";
import { MAP_ZOOM } from "../components/map/mapConstants";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { ROUTES } from "../config/constants";
import type { ProjectMapData, ProjectMapStreet } from "../types/api.types";
import { groupProjectMapStreetsByName } from "../utils/group-streets-by-name";

function projectMapCenter(mapData: ProjectMapData): { lat: number; lng: number } {
  const b = mapData.boundary;
  if (b.type === "circle") return b.center;
  const coords = b.coordinates;
  if (!coords.length) return { lat: 50.8, lng: -1.09 };
  const sum = coords.reduce(
    (a, p) => [a[0] + p[0], a[1] + p[1]],
    [0, 0]
  );
  return { lat: sum[1] / coords.length, lng: sum[0] / coords.length };
}

/** Normalize osmId to "way/..." for consistent map highlighting */
function normalizeOsmId(osmId: string): string {
  return osmId.startsWith("way/") ? osmId : `way/${osmId}`;
}

/** Compute bbox from street geometries for fitBounds */
function computeBboxFromStreets(
  streets: ProjectMapStreet[]
): [number, number, number, number] {
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;
  for (const s of streets) {
    const coords = s.geometry?.coordinates ?? [];
    for (const [lng, lat] of coords) {
      if (lat < minLat) minLat = lat;
      if (lng < minLng) minLng = lng;
      if (lat > maxLat) maxLat = lat;
      if (lng > maxLng) maxLng = lng;
    }
  }
  if (minLat === Infinity) return [0, 0, 0, 0];
  return [minLat, minLng, maxLat, maxLng];
}

/** Compute bounding box from boundary for fitting map view */
function computeBoundaryBbox(boundary: ProjectMapData["boundary"]): [number, number, number, number] | null {
  if (boundary.type === "circle") {
    const { center, radiusMeters } = boundary;
    const latDeg = radiusMeters / 111320;
    const lngDeg = radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));
    return [
      center.lat - latDeg,
      center.lng - lngDeg,
      center.lat + latDeg,
      center.lng + lngDeg,
    ];
  }
  // Polygon boundary
  const coords = boundary.coordinates;
  if (!coords.length) return null;
  let minLat = coords[0][1];
  let maxLat = coords[0][1];
  let minLng = coords[0][0];
  let maxLng = coords[0][0];
  for (const [lng, lat] of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return [minLat, minLng, maxLat, maxLng];
}

export function ProjectMapPage() {
  const { id } = useParams<{ id: string }>();
  const [mapData, setMapData] = useState<ProjectMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightOsmIds, setHighlightOsmIds] = useState<string[]>([]);
  const [streetHighlightBbox, setStreetHighlightBbox] = useState<
    [number, number, number, number] | null
  >(null);

  const fetchMap = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await projectsService.getMap(id);
      setMapData(res.map);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load map");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMap();
  }, [fetchMap]);

  const groupedStreets = useMemo(() => {
    if (!mapData?.streets) return [];
    return groupProjectMapStreetsByName(mapData.streets);
  }, [mapData?.streets]);

  const handleStreetHighlight = useCallback(
    (streetData: StreetListItemData) => {
      if (!mapData?.streets) return;
      const osmIdSet = new Set(
        streetData.osmIds.map((id) => normalizeOsmId(id))
      );
      const matching = mapData.streets.filter((s) =>
        osmIdSet.has(normalizeOsmId(s.osmId))
      );
      if (matching.length === 0) return;
      setStreetHighlightBbox(computeBboxFromStreets(matching));
      setHighlightOsmIds(matching.map((s) => s.osmId));
    },
    [mapData?.streets]
  );

  const handleStreetClear = useCallback(() => {
    setHighlightOsmIds([]);
    setStreetHighlightBbox(null);
  }, []);

  if (!id) {
    return (
      <div className="p-4">
        <p className="text-danger">Missing project ID</p>
        <Link to={ROUTES.PROJECTS_LIST}>Back to projects</Link>
      </div>
    );
  }

  if (loading && !mapData) {
    return (
      <div className="p-4">
        <p className="text-text-muted">Loading map…</p>
      </div>
    );
  }

  if (error && !mapData) {
    return (
      <Card className="max-w-md">
        <p className="text-danger">{error}</p>
        <Button variant="secondary" onClick={fetchMap} className="mt-2">
          Retry
        </Button>
        <Link to={`/projects/${id}`} className="mt-3 block">
          Back to project
        </Link>
      </Card>
    );
  }

  if (!mapData) return null;

  const center = projectMapCenter(mapData);
  const boundaryBbox = computeBoundaryBbox(mapData.boundary);

  const highlightFocus =
    streetHighlightBbox !== null
      ? { bbox: streetHighlightBbox }
      : boundaryBbox !== null
        ? { bbox: boundaryBbox }
        : null;

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/projects/${id}`}
            className="text-sm text-text-muted hover:underline"
          >
            ← Back to project
          </Link>
          <h1 className="text-xl font-bold text-text">{mapData.name}</h1>
        </div>
      </div>
      <p className="mb-3 text-sm text-text-muted">
        {mapData.stats.completedStreetNames ?? mapData.stats.completedStreets}{" "}
        completed · {mapData.stats.partialStreets} partial ·{" "}
        {mapData.stats.notRunStreets} not run
      </p>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row" style={{ minHeight: "500px", height: "70vh" }}>
        <div className="min-h-[40vh] flex-1 md:min-h-0">
          <UnifiedMap
            center={center}
            zoom={MAP_ZOOM.PROJECT_DETAIL}
            streets={mapData.streets}
            defaultVisibleStatuses={new Set(["completed", "partial", "not_started"])}
            availableStatuses={["completed", "partial", "not_started"]}
            boundary={mapData.boundary}
            showBoundaryOutline
            highlightFocus={highlightFocus}
            highlightOsmIds={highlightOsmIds}
            showLegend
            className="h-full w-full"
          />
        </div>
        <aside className="w-full shrink-0 border-border bg-surface md:w-[340px] md:overflow-y-auto md:border-l-2">
          <div className="flex flex-col gap-4 p-4">
            <h3 className="text-sm font-semibold text-text">Streets</h3>
            <details className="space-y-2" open>
              <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted min-h-[44px] flex items-center">
                Streets ({groupedStreets.filter((g) => !g.completed).length} to complete)
              </summary>
              <Card padding="sm" className="mt-1 max-h-[40vh] overflow-y-auto md:max-h-[50vh]">
                {groupedStreets.length === 0 ? (
                  <p className="text-text-muted text-sm">No streets</p>
                ) : (
                  <ul className="list-none divide-y divide-border space-y-0 p-0">
                    {groupedStreets
                      .filter((g) => !g.completed)
                      .map((row) => (
                        <StreetListItem
                          key={row.name}
                          street={row}
                          onHighlight={handleStreetHighlight}
                          onClearHighlight={handleStreetClear}
                          variant="homepage"
                        />
                      ))}
                    {groupedStreets.every((g) => g.completed) && (
                      <li className="px-3 py-2 text-sm text-text-muted">
                        All streets completed!
                      </li>
                    )}
                  </ul>
                )}
              </Card>
            </details>
          </div>
        </aside>
      </div>
    </div>
  );
}
