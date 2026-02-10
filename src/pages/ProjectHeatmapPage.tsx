/**
 * ProjectHeatmapPage
 * Full-page activity density heatmap for a project.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer } from "react-leaflet";
import { Button, Card } from "../components/common";
import { ProjectHeatmap } from "../components/projects";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { ROUTES } from "../config/constants";
import type { ProjectHeatmapData } from "../types/api.types";

const DEFAULT_CENTER: [number, number] = [50.8, -1.09];
const DEFAULT_ZOOM = 13;

export function ProjectHeatmapPage() {
  const { id } = useParams<{ id: string }>();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<ProjectHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [projectRes, heatmapRes] = await Promise.all([
        projectsService.getById(id),
        projectsService.getHeatmap(id),
      ]);
      setProjectName(projectRes.project.name);
      setHeatmapData(heatmapRes.heatmap);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load heatmap data"
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

  if (loading && !heatmapData) {
    return (
      <div className="p-4">
        <p className="text-text-muted">Loading…</p>
      </div>
    );
  }

  if (error && !heatmapData) {
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

  const center: [number, number] =
    heatmapData && heatmapData.points.length > 0
      ? [
          (heatmapData.bounds.south + heatmapData.bounds.north) / 2,
          (heatmapData.bounds.west + heatmapData.bounds.east) / 2,
        ]
      : DEFAULT_CENTER;

  return (
    <div className="flex flex-col p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/projects/${id}`}
            className="text-sm text-text-muted hover:underline"
          >
            Back to project
          </Link>
          <h1 className="text-xl font-bold text-text">
            {projectName ?? "Project"} – Heatmap
          </h1>
        </div>
      </div>
      <p className="mb-3 text-text-muted text-sm">
        Activity density: brighter areas = more runs through that spot.
      </p>
      <div className="h-[70vh] min-h-[400px] w-full overflow-hidden rounded border-2 border-border">
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {heatmapData && heatmapData.points.length > 0 && (
            <ProjectHeatmap heatmapData={heatmapData} />
          )}
        </MapContainer>
      </div>
      {heatmapData && heatmapData.points.length === 0 && (
        <p className="mt-2 text-text-muted text-sm">
          No activity points in this project yet. Run in the area and sync
          activities to see the heatmap.
        </p>
      )}
    </div>
  );
}
