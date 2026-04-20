/**
 * ProjectsPage
 * List of user's projects. Each card links to project detail.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  ChipGroup,
  ConfirmModal,
  PageHeader,
  SkeletonProjectCard,
} from "../components/common";
import { ProjectCard } from "../components/projects";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { useToast } from "../contexts/ToastContext";
import type { ProjectListItem } from "../types/api.types";

type FilterMode = "active" | "archived";

export function ProjectsPage() {
  const [allProjects, setAllProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("active");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const toast = useToast();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectsService.getAll({ includeArchived: true });
      setAllProjects(res.projects);
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

  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) =>
      filterMode === "active" ? !p.isArchived : p.isArchived
    );
  }, [allProjects, filterMode]);

  const activeCount = useMemo(
    () => allProjects.filter((p) => !p.isArchived).length,
    [allProjects]
  );
  const archivedCount = useMemo(
    () => allProjects.filter((p) => p.isArchived).length,
    [allProjects]
  );

  const handleRestore = useCallback(
    async (projectId: string) => {
      setActionLoading(projectId);
      try {
        await projectsService.restore(projectId);
        toast?.showToast("Project restored", "success");
        await fetchProjects();
      } catch (err) {
        toast?.showToast(
          err instanceof ApiError ? err.message : "Failed to restore project",
          "error"
        );
      } finally {
        setActionLoading(null);
      }
    },
    [fetchProjects, toast]
  );

  const handleDeletePermanent = useCallback(async () => {
    if (!deleteConfirmId) return;
    setActionLoading(deleteConfirmId);
    try {
      await projectsService.deletePermanently(deleteConfirmId);
      toast?.showToast("Project permanently deleted", "success");
      setDeleteConfirmId(null);
      await fetchProjects();
    } catch (err) {
      toast?.showToast(
        err instanceof ApiError ? err.message : "Failed to delete project",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  }, [deleteConfirmId, fetchProjects, toast]);

  const listLoading = loading && allProjects.length === 0;

  if (error && allProjects.length === 0 && !loading) {
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
    <div className="p-4 pb-8">
      <PageHeader
        title="Projects"
        actions={(
          <Link to="/projects/new" className="shrink-0">
            <Button variant="primary" size="md">
              Create new project
            </Button>
          </Link>
        )}
      />

      {/* Filter tabs — counts fill in when data loads */}
      <ChipGroup
        className="mb-4"
        value={filterMode}
        onChange={(value) => setFilterMode(value as FilterMode)}
        items={[
          { value: "active", label: `Active (${listLoading ? "…" : activeCount})` },
          { value: "archived", label: `Archived (${listLoading ? "…" : archivedCount})` },
        ]}
      />

      {listLoading ? (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <li key={i}>
              <SkeletonProjectCard />
            </li>
          ))}
        </ul>
      ) : filteredProjects.length === 0 ? (
        <Card className="space-y-4">
          {filterMode === "active" ? (
            <>
              <p className="text-sm text-text-muted">
                No active projects yet. Create a project to track streets in an
                area.
              </p>
              <Link to="/projects/new" className="inline-block">
                <Button variant="primary" size="md">
                  Create your first project
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-text-muted">No archived projects.</p>
          )}
        </Card>
      ) : (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <li key={project.id}>
              <ProjectCard
                project={project}
                showActions={filterMode === "archived"}
                onRestore={() => handleRestore(project.id)}
                onDelete={() => setDeleteConfirmId(project.id)}
                actionLoading={actionLoading === project.id}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Permanently delete project?"
        message="This action cannot be undone. All project data, including progress and milestones, will be permanently deleted. Your activity data (runs) will NOT be affected."
        confirmLabel="Delete permanently"
        variant="danger"
        onConfirm={handleDeletePermanent}
      />
    </div>
  );
}
