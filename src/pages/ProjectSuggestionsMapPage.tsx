/**
 * ProjectSuggestionsMapPage
 * Full-page map with suggested streets highlighted in blue.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, Card } from "../components/common";
import { ProjectMap } from "../components/projects";
import { projectsService } from "../services/projects.service";
import { suggestionsService } from "../services/suggestions.service";
import { ApiError } from "../lib/api-client";
import { ROUTES } from "../config/constants";
import type { ProjectMapData } from "../types/api.types";

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
      <Card className="max-w-md">
        <p className="text-danger">{error}</p>
        <Button variant="secondary" onClick={fetchData} className="mt-2">
          Retry
        </Button>
        <Link to={`/projects/${id}`} className="mt-3 block">
          Back to project
        </Link>
      </Card>
    );
  }

  if (!mapData) return null;

  return (
    <div className="flex flex-col p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
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
      <p className="mb-3 text-sm text-text-muted">
        {suggestedOsmIds.size} suggested street(s) highlighted in blue
      </p>
      <ProjectMap
        mapData={mapData}
        suggestedOsmIds={suggestedOsmIds}
        showSuggestedLegend
        className="h-[70vh] min-h-[500px] w-full"
      />
    </div>
  );
}
