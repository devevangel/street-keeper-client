/**
 * ProjectSuggestionsMapPage
 * Full-page map with suggested streets highlighted in blue.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, Card } from "../components/common";
import { UnifiedMap } from "../components/map";
import { MAP_ZOOM } from "../components/map/mapConstants";
import { projectsService } from "../services/projects.service";
import { suggestionsService } from "../services/suggestions.service";
import { ApiError } from "../lib/api-client";
import { ROUTES } from "../config/constants";
import type { ProjectMapData } from "../types/api.types";

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

export function ProjectSuggestionsMapPage() {
  const { id } = useParams<{ id: string }>();
  const [mapData, setMapData] = useState<ProjectMapData | null>(null);
  const [suggestedOsmIds, setSuggestedOsmIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [mapRes, suggestions] = await Promise.all([
        projectsService.getMap(id),
        suggestionsService.getSuggestions(id, { maxResults: 10 }),
      ]);
      setMapData(mapRes.map);
      const ids = new Set<string>();
      for (const s of suggestions.almostComplete) ids.add(s.osmId);
      for (const s of suggestions.nearest) ids.add(s.osmId);
      if (suggestions.milestone) {
        for (const s of suggestions.milestone.streets) ids.add(s.osmId);
      }
      for (const cluster of suggestions.clusters) {
        for (const s of cluster.streets) ids.add(s.osmId);
      }
      setSuggestedOsmIds(ids);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load suggestions map"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      <Card className="m-4 max-w-md space-y-4">
        <p className="text-sm text-danger">{error}</p>
        <Button variant="secondary" onClick={fetchData}>
          Retry
        </Button>
        <Link to={`/projects/${id}`} className="block text-sm text-text-muted hover:underline">
          Back to project
        </Link>
      </Card>
    );
  }

  if (!mapData) return null;

  const center = projectMapCenter(mapData);
  const boundaryBbox = computeBoundaryBbox(mapData.boundary);

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to={`/projects/${id}`}
            className="text-sm text-text-muted hover:underline"
          >
            ← Back to project
          </Link>
          <h1 className="text-xl font-bold text-text">
            {mapData.name} — Suggestions
          </h1>
        </div>
      </div>
      <p className="mb-4 text-sm text-text-muted">
        {suggestedOsmIds.size} suggested street(s) highlighted in blue
      </p>
      <div className="flex-1" style={{ minHeight: "500px", height: "70vh" }}>
        <UnifiedMap
          center={center}
          zoom={MAP_ZOOM.PROJECT_DETAIL}
          streets={mapData.streets}
          defaultVisibleStatuses={new Set(["completed", "partial", "not_started"])}
          availableStatuses={["completed", "partial", "not_started"]}
          boundary={mapData.boundary}
          showBoundaryOutline
          highlightFocus={boundaryBbox ? { bbox: boundaryBbox } : null}
          highlightOsmIds={Array.from(suggestedOsmIds)}
          showLegend
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
