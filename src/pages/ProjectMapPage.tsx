/**
 * ProjectMapPage
 * Project-scoped map: streets coloured by status (completed / partial / not run).
 * Optional base map toggle. Back link to project detail.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, Card } from "../components/common";
import { ProjectMap } from "../components/projects";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { ROUTES } from "../config/constants";
import type { ProjectMapData } from "../types/api.types";

export function ProjectMapPage() {
  const { id } = useParams<{ id: string }>();
  const [mapData, setMapData] = useState<ProjectMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <h1 className="text-xl font-bold text-text">{mapData.name}</h1>
        </div>
      </div>
      <p className="mb-3 text-sm text-text-muted">
        {mapData.stats.completedStreetNames ?? mapData.stats.completedStreets}{" "}
        completed · {mapData.stats.partialStreets} partial ·{" "}
        {mapData.stats.notRunStreets} not run
      </p>
      <ProjectMap mapData={mapData} className="h-[70vh] min-h-[500px] w-full" />
    </div>
  );
}
