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
import {
  Button,
  ChipGroup,
  ConfirmModal,
  Input,
  PageHeader,
  Select,
  SkeletonMilestoneCard,
} from "../components/common";
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
    <div className="flex min-h-[56px] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onPinChange(id, !isPinned)}
        className="min-w-[44px] shrink-0"
        aria-label={isPinned ? "Unpin milestone" : "Pin milestone"}
        title={isPinned ? "Unpin" : "Pin"}
      >
        {isPinned ? "📌" : "📍"}
      </Button>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-text">{name}</div>
        <div className="mt-1 flex items-center gap-2">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-border/30"
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
        <div className="mt-1 text-sm text-text-muted">
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
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => onDelete(id)}
          className="min-w-[44px] shrink-0"
          aria-label="Delete milestone"
          title="Delete"
        >
          🗑
        </Button>
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const handleDeleteRequest = (id: string) => setDeleteConfirmId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    await deleteMilestone(deleteConfirmId);
    setMilestones((prev) => prev.filter((m) => m.id !== deleteConfirmId));
  };

  if (loading && milestones.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-4 pb-8">
        <PageHeader title="Milestones" />
        <p className="mb-4 text-sm text-text-muted">
          Track and complete goals. Filter to find easy wins or ones you're close to finishing.
        </p>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonMilestoneCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 pb-8">
      <PageHeader
        title="Milestones"
        actions={
          <Button type="button" variant="secondary" size="md" onClick={() => setCreateModalOpen(true)}>
            Add global milestone
          </Button>
        }
      />
      <p className="mb-4 text-sm text-text-muted">
        Track and complete goals. Filter to find easy wins or ones you’re close to finishing.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[180px] flex-1"
          aria-label="Search milestones by name"
        />
        <ChipGroup
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as StatusFilter)}
          items={[
            { value: "all", label: "All" },
            { value: "almost_there", label: "Almost there (≥70%)" },
            { value: "in_progress", label: "In progress" },
            { value: "not_started", label: "Not started" },
          ]}
        />
        <Select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value as ScopeFilter)}
          options={[
            { value: "all", label: "All projects" },
            { value: "global", label: "Global only" },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
          aria-label="Filter by project"
          className="min-w-[180px]"
        />
      </div>

      {filteredMilestones.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          {milestones.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-text-muted">No milestones yet.</p>
              <Button
                type="button"
                variant="primary"
                onClick={() => setCreateModalOpen(true)}
              >
                Add your first milestone
              </Button>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No milestones match your filters. Try changing search or filters.</p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          {filteredMilestones.map((m) => (
            <MilestoneRow
              key={m.id}
              m={m}
              projectName={m.projectId ? (projectById.get(m.projectId)?.name ?? null) : "Global"}
              onPinChange={handlePinChange}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      <CreateMilestoneModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={fetchData}
      />

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete milestone?"
        message={
          deleteConfirmId
            ? `"${milestones.find((m) => m.id === deleteConfirmId)?.name ?? "This milestone"}" will be permanently deleted.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
