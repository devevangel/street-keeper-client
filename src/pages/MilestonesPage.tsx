/**
 * MilestonesPage
 * List all user milestones with filter and search. Helps users find easy wins and almost-there goals.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getMilestones,
  pinMilestone,
  deleteMilestone,
} from "../services/milestones.service";
import { projectsService } from "../services/projects.service";
import { Button, Input } from "../components/common";
import { CreateMilestoneModal } from "../components/projects/CreateMilestoneModal";
import { ROUTES } from "../config/constants";
import type { MilestoneWithProgress } from "../types/api.types";
import type { ProjectListItem } from "../types/api.types";

type StatusFilter = "all" | "almost_there" | "in_progress" | "not_started";
type ScopeFilter = "all" | "global" | string; // string = projectId

function MilestoneRow({
  m,
  projectName,
  onPinChange,
  onDelete,
}: {
  m: MilestoneWithProgress;
  projectName: string | null;
  onPinChange: (id: string, isPinned: boolean) => void;
  onDelete: ((id: string) => void) | null;
}) {
  const { id, name, progress, isPinned, kind } = m;
  const pct = Math.round(progress.ratio * 100);
  const canDelete = kind === "custom" && onDelete;

  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => onPinChange(id, !isPinned)}
        className="shrink-0 rounded p-1 text-text-muted hover:bg-muted hover:text-text"
        aria-label={isPinned ? "Unpin milestone" : "Pin milestone"}
        title={isPinned ? "Unpin" : "Pin"}
      >
        {isPinned ? "📌" : "📍"}
      </button>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-text">{name}</div>
        <div className="mt-1 flex items-center gap-2">
          <div
            className="h-2 flex-1 overflow-hidden rounded bg-border"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${name}: ${pct}%`}
          >
            <div
              className={`h-full transition-all ${
                progress.isCompleted ? "bg-success" : "bg-primary"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-sm text-text-muted">
            {progress.currentValue} / {progress.targetValue} {progress.unit}
          </span>
        </div>
        <div className="mt-1 text-xs text-text-muted">
          {projectName ?? "Global"}
        </div>
      </div>
      {m.projectId && (
        <Link
          to={`${ROUTES.PROJECTS_LIST}/${m.projectId}`}
          className="shrink-0 text-sm text-primary hover:underline"
        >
          View project
        </Link>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="shrink-0 rounded p-1 text-text-muted hover:bg-danger/20 hover:text-danger"
          aria-label="Delete milestone"
          title="Delete"
        >
          🗑
        </button>
      )}
    </div>
  );
}

export function MilestonesPage() {
  const [milestones, setMilestones] = useState<MilestoneWithProgress[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [milestoneRes, projectRes] = await Promise.all([
        getMilestones(), // no projectId = all milestones
        projectsService.getAll(),
      ]);
      setMilestones(milestoneRes);
      setProjects(projectRes.projects);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!m.name.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== "all") {
        const r = m.progress.ratio;
        if (statusFilter === "almost_there" && r < 0.7) return false;
        if (statusFilter === "in_progress" && (r <= 0 || r >= 0.7)) return false;
        if (statusFilter === "not_started" && r > 0) return false;
      }
      if (scopeFilter !== "all") {
        if (scopeFilter === "global" && m.projectId != null) return false;
        if (scopeFilter !== "global" && m.projectId !== scopeFilter) return false;
      }
      return true;
    });
  }, [milestones, search, statusFilter, scopeFilter]);

  const projectById = useMemo(() => {
    const map = new Map<string, ProjectListItem>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  const handlePinChange = async (id: string, isPinned: boolean) => {
    await pinMilestone(id, isPinned);
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isPinned } : m)),
    );
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this milestone?")) return;
    await deleteMilestone(id);
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  if (loading && milestones.length === 0) {
    return (
      <div className="p-4">
        <p className="text-text-muted">Loading milestones…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold text-text mb-2">Milestones</h1>
      <p className="text-text-muted text-sm mb-4">
        Track and complete goals. Filter to find easy wins or ones you’re close to finishing.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[180px] flex-1"
          aria-label="Search milestones by name"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded border border-border bg-bg px-3 py-2 text-text text-sm"
          aria-label="Filter by progress"
        >
          <option value="all">All</option>
          <option value="almost_there">Almost there (≥70%)</option>
          <option value="in_progress">In progress</option>
          <option value="not_started">Not started</option>
        </select>
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value as ScopeFilter)}
          className="rounded border border-border bg-bg px-3 py-2 text-text text-sm"
          aria-label="Filter by project"
        >
          <option value="all">All projects</option>
          <option value="global">Global only</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {filteredMilestones.length === 0 ? (
        <div className="rounded border border-border bg-surface p-6 text-center text-text-muted">
          {milestones.length === 0 ? (
            <>
              <p className="mb-3">No milestones yet.</p>
              <Button
                type="button"
                variant="primary"
                onClick={() => setCreateModalOpen(true)}
              >
                Add your first milestone
              </Button>
            </>
          ) : (
            <p>No milestones match your filters. Try changing search or filters.</p>
          )}
        </div>
      ) : (
        <div className="rounded border border-border bg-surface p-3">
          {filteredMilestones.map((m) => (
            <MilestoneRow
              key={m.id}
              m={m}
              projectName={m.projectId ? (projectById.get(m.projectId)?.name ?? null) : "Global"}
              onPinChange={handlePinChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {milestones.length > 0 && (
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setCreateModalOpen(true)}
          >
            Add global milestone
          </Button>
        </div>
      )}

      <CreateMilestoneModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={fetchData}
      />
    </div>
  );
}
