/**
 * ProjectDetailPage
 * Project detail: name, stats, "View Map", Refresh, Archive.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button, Card } from "../components/common";
import { ProjectStats } from "../components/projects";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { ROUTES } from "../config/constants";
import type { ProjectDetail } from "../types/api.types";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<
    "refresh" | "archive" | null
  >(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await projectsService.getById(id);
      setProject(res.project);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load project"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleRefresh = async () => {
    if (!id) return;
    setActionLoading("refresh");
    try {
      const res = await projectsService.refresh(id);
      setProject(res.project);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to refresh streets"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    if (
      !window.confirm("Archive this project? It will be hidden from your list.")
    )
      return;
    setActionLoading("archive");
    try {
      await projectsService.delete(id);
      navigate(ROUTES.PROJECTS_LIST);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to archive project"
      );
      setActionLoading(null);
    }
  };

  if (!id) {
    return (
      <div className="p-4">
        <p className="text-danger">Missing project ID</p>
        <Link to={ROUTES.PROJECTS_LIST}>Back to projects</Link>
      </div>
    );
  }

  if (loading && !project) {
    return (
      <div className="p-4">
        <p className="text-text-muted">Loading project…</p>
      </div>
    );
  }

  if (error && !project) {
    return (
      <Card className="max-w-md">
        <p className="text-danger">{error}</p>
        <Button variant="secondary" onClick={fetchProject} className="mt-2">
          Retry
        </Button>
        <Link to={ROUTES.PROJECTS_LIST} className="mt-3 block">
          Back to projects
        </Link>
      </Card>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link
          to={ROUTES.PROJECTS_LIST}
          className="text-sm text-text-muted hover:underline"
        >
          ← Back to projects
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text">{project.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Link to={`/projects/${project.id}/map`}>
            <Button variant="secondary" size="sm">
              View Map
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={actionLoading !== null}
          >
            {actionLoading === "refresh" ? "Refreshing…" : "Refresh streets"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleArchive}
            disabled={actionLoading !== null}
          >
            {actionLoading === "archive" ? "Archiving…" : "Archive"}
          </Button>
        </div>
      </div>

      {project.refreshNeeded && (
        <Card padding="sm" className="mb-4 border-warning bg-warning/10">
          <p className="text-sm text-text">
            Street data is {project.daysSinceRefresh} days old. Consider
            refreshing to include new roads.
          </p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <ProjectStats
          totalStreets={project.totalStreets}
          completedStreets={project.completedStreets}
          inProgressCount={project.inProgressCount}
          notStartedCount={project.notStartedCount}
          progress={project.progress}
        />
        <Card>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-text-muted">
            About
          </h3>
          <p className="text-sm text-text">
            {project.radiusMeters >= 1000
              ? `${project.radiusMeters / 1000} km`
              : `${project.radiusMeters} m`}{" "}
            radius · Snapshot from{" "}
            {new Date(project.snapshotDate).toLocaleDateString()}
          </p>
        </Card>
      </div>
    </div>
  );
}
