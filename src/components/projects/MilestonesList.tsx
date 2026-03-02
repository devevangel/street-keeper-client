/**
 * MilestonesList
 * Lists project milestones with progress bars, pin toggle, add and delete.
 */

import { useEffect, useState, useCallback } from "react";
import {
  getMilestones,
  pinMilestone,
  deleteMilestone,
} from "../../services/milestones.service";
import { Button, ConfirmModal } from "../common";
import { CreateMilestoneModal } from "./CreateMilestoneModal";
import type { MilestoneWithProgress } from "../../types/api.types";

export interface MilestonesListProps {
  projectId: string;
  projectName?: string;
}

function MilestoneRow({
  m,
  onPinChange,
  onDelete,
}: {
  m: MilestoneWithProgress;
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
      </div>
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

export function MilestonesList({
  projectId,
  projectName,
}: MilestonesListProps) {
  const [milestones, setMilestones] = useState<MilestoneWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMilestones(projectId);
      setMilestones(data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

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

  if (loading) {
    return (
      <div className="space-y-3 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-muted" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-2 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="p-4">
        <p className="text-center text-sm text-text-muted mb-3">
          No milestones for this project yet.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="w-full min-h-[44px]"
        >
          Add milestone
        </Button>
        <CreateMilestoneModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          projectId={projectId}
          projectName={projectName}
          onCreated={fetchMilestones}
        />
      </div>
    );
  }

  return (
    <div className="p-2">
      {milestones.map((m) => (
        <MilestoneRow
          key={m.id}
          m={m}
          onPinChange={handlePinChange}
          onDelete={handleDeleteRequest}
        />
      ))}
      <div className="mt-3 border-t border-border pt-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="w-full min-h-[44px]"
        >
          Add milestone
        </Button>
      </div>
      <CreateMilestoneModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projectId}
        projectName={projectName}
        onCreated={fetchMilestones}
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
