/**
 * ProjectSuggestionsMapPage
 * Full-page map with suggested streets highlighted in blue.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, Card, Skeleton } from "../components/common";
import { UnifiedMap } from "../components/map";
import { MAP_ZOOM } from "../components/map/mapConstants";
import { projectsService } from "../services/projects.service";
import { suggestionsService } from "../services/suggestions.service";
import { ApiError } from "../lib/api-client";
import { ROUTES } from "../config/constants";
import type { ProjectMapData } from "../types/api.types";
import { projectMapCenter, computeBoundaryBbox } from "../utils/map-utils";

const MAP_SHELL_CENTER = { lat: 50.8, lng: -1.09 };

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
      <div className="flex h-full flex-col overflow-hidden md:flex-row">
        <div className="h-[45vh] w-full shrink-0 md:h-full md:min-h-0 md:flex-1 md:shrink">
          <div className="h-full w-full">
            <UnifiedMap
              center={MAP_SHELL_CENTER}
              zoom={MAP_ZOOM.DEFAULT}
              streets={[]}
              className="h-full w-full"
            />
          </div>
        </div>
        <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto border-border bg-surface md:w-[380px] md:flex-none md:border-l">
          <div className="p-4 pb-8 md:pb-4">
            <Skeleton className="mb-4 h-4 w-32" />
            <Skeleton className="mb-2 h-8 w-3/4" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
        </aside>
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
    <div className="flex h-full flex-col overflow-hidden md:flex-row">
      {/* Map section */}
      <div className="h-[45vh] w-full shrink-0 md:h-full md:min-h-0 md:flex-1 md:shrink">
        <div className="h-full w-full">
          <UnifiedMap
            center={center}
            zoom={MAP_ZOOM.PROJECT_DETAIL}
            streets={mapData.streets}
            boundary={mapData.boundary}
            showBoundaryOutline
            highlightFocus={boundaryBbox ? { bbox: boundaryBbox } : null}
            highlightOsmIds={Array.from(suggestedOsmIds)}
            showLegend
            className="h-full w-full"
          />
        </div>
      </div>

      {/* Info panel - right side */}
      <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto border-border bg-surface md:w-[380px] md:flex-none md:border-l">
        <div className="p-4 pb-8 md:pb-4">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Link
              to={`/projects/${id}`}
              className="text-sm text-text-muted hover:underline"
            >
              ← Back to project
            </Link>
          </div>
          <h1 className="text-xl font-bold text-text mb-2">
            {mapData.name} — Suggestions
          </h1>
          <p className="text-sm text-text-muted">
            {suggestedOsmIds.size} suggested street(s) highlighted in blue
          </p>
        </div>
      </aside>
    </div>
  );
}
