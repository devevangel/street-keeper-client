/**
 * MilestonesSection Component (MVP)
 * Displays active and completed milestones for a project, handles celebrations.
 * Collapsible section showing goals with percentage calculations.
 */

import { useEffect, useState, useCallback } from "react";
import { MilestoneCard } from "./MilestoneCard";
import { CelebrationModal } from "./CelebrationModal";
import { Card } from "../common";
import {
  getProjectMilestones,
  acknowledgeMilestone,
  type ProjectMilestonesResponse,
} from "../../services/milestones.service";

interface MilestonesSectionProps {
  projectId: string;
}

export function MilestonesSection({ projectId }: MilestonesSectionProps) {
  const [milestones, setMilestones] = useState<ProjectMilestonesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebration, setCelebration] = useState<
    ProjectMilestonesResponse["pendingCelebrations"][0] | null
  >(null);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjectMilestones(projectId);
      setMilestones(data);
      // Show first pending celebration if any
      if (data.pendingCelebrations.length > 0 && !celebration) {
        setCelebration(data.pendingCelebrations[0]);
      }
    } catch (err) {
      // Silently handle 404s (project might have been deleted)
      if (err instanceof Error && (err.message.includes("404") || err.message.includes("not found"))) {
        // Project doesn't exist, set milestones to empty
        setMilestones({ active: [], completed: [], pendingCelebrations: [] });
      } else {
        console.error("Failed to fetch milestones:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, celebration]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleAcknowledge = async (milestoneId: string) => {
    try {
      await acknowledgeMilestone(milestoneId);
      // Refresh milestones after acknowledging
      await fetchMilestones();
    } catch (err) {
      console.error("Failed to acknowledge milestone:", err);
      throw err;
    }
  };

  const handleCloseCelebration = () => {
    setCelebration(null);
    // Refresh to get updated list
    fetchMilestones();
  };

  const totalMilestones = milestones ? milestones.active.length + milestones.completed.length : 0;
  const hasAnyMilestones = milestones && totalMilestones > 0;

  if (loading) {
    return (
      <details className="mb-4">
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted min-h-[44px] flex items-center">
          Your Goals
        </summary>
        <Card className="mt-1">
          <div className="space-y-3 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border-2 border-border rounded-lg bg-surface animate-pulse">
                <div className="h-4 w-32 bg-muted rounded mb-2" />
                <div className="h-2 bg-muted rounded" />
              </div>
            ))}
          </div>
        </Card>
      </details>
    );
  }

  if (!hasAnyMilestones) {
    return null;
  }

  return (
    <>
      <details className="mb-4">
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted min-h-[44px] flex items-center">
          Your Goals {totalMilestones > 0 && `(${milestones!.active.length} active${milestones!.completed.length > 0 ? `, ${milestones!.completed.length} completed` : ""})`}
        </summary>
        <Card className="mt-1">
          <div className="space-y-3 p-2">
            {/* Active milestones */}
            {milestones!.active.length > 0 && (
              <>
                {milestones!.active.map((m) => {
                  return (
                    <MilestoneCard
                      key={m.id}
                      milestone={{
                        id: m.id,
                        name: m.name,
                        targetValue: m.targetValue,
                        currentValue: m.currentValue,
                      }}
                    />
                  );
                })}
              </>
            )}

            {/* Completed milestones */}
            {milestones!.completed.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wide">
                  Completed ({milestones!.completed.length})
                </h3>
                <div className="space-y-2">
                  {milestones!.completed.map((m) => {
                    const progressPercent = 100; // Completed = 100%
                    return (
                      <div
                        key={m.id}
                        className="p-3 border border-success/30 rounded-lg bg-success/5 opacity-75"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-text line-through">{m.name}</span>
                          <span className="text-xs text-success font-semibold">✓ Complete</span>
                        </div>
                        <div className="h-2 bg-success/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success transition-all"
                            style={{ width: "100%" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>
      </details>

      {celebration && (
        <CelebrationModal
          milestone={celebration}
          onClose={handleCloseCelebration}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </>
  );
}
