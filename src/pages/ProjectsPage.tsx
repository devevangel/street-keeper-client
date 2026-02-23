/**
 * ProjectsPage
 * List of user's projects. Each card links to project detail.
 */

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "../components/common";
import { ProjectCard } from "../components/projects";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import type { ProjectListItem } from "../types/api.types";

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectsService.getAll();
      setProjects(res.projects);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (loading && projects.length === 0) {
    return (
      <div className="p-4">
        <p className="text-text-muted">Loading projects…</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="m-4 max-w-md space-y-4">
        <p className="text-sm text-danger">{error}</p>
        <Button variant="secondary" onClick={fetchProjects}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-text">Projects</h1>
        <Link to="/projects/new" className="shrink-0">
          <Button variant="primary" size="md">Create new project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="space-y-4">
          <p className="text-sm text-text-muted">
            No projects yet. Create a project to track streets in an area.
          </p>
          <Link to="/projects/new" className="inline-block">
            <Button variant="primary" size="md">Create your first project</Button>
          </Link>
        </Card>
      ) : (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
