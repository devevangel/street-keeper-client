/**
 * ProjectCreatedModal
 * Shown after successfully creating a project: celebration, street count, goals, and next-step CTAs.
 * Applies behavioral patterns: small wins first, celebration, progress visibility, achievable goals.
 */

import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { Modal, Button } from "../common";
import { ROUTES } from "../../config/constants";
import { usePreferences } from "../../contexts/PreferencesContext";
import { getProjectMilestones } from "../../services/milestones.service";

export interface ProjectCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  totalStreets: number;
  totalLengthMeters: number;
}

export function ProjectCreatedModal({
  isOpen,
  onClose,
  projectId,
  totalStreets,
  totalLengthMeters,
}: ProjectCreatedModalProps) {
  const navigate = useNavigate();
  const projectUrl = ROUTES.PROJECT_DETAIL.replace(":id", projectId);
  const suggestionsUrl = ROUTES.PROJECT_SUGGESTIONS.replace(":id", projectId);

  const [milestones, setMilestones] = useState<Array<{
    id: string;
    name: string;
    targetValue: number;
    currentValue: number;
  }>>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const confettiFired = useRef(false);

  // Trigger confetti animation when modal opens
  useEffect(() => {
    if (!isOpen || confettiFired.current) return;
    
    // Small delay to ensure modal is fully rendered
    const timeoutId = setTimeout(() => {
      confettiFired.current = true;

      // Initial big burst from center (like throwing confetti up)
      const burst = () => {
        // Main center burst (upward)
        confetti({
          particleCount: 100,
          angle: 90,
          spread: 70,
          origin: { x: 0.5, y: 0.6 },
          colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"],
          gravity: 0.8,
          ticks: 200,
        });

        // Left side burst
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0.2, y: 0.8 },
          colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"],
          gravity: 0.8,
          ticks: 200,
        });

        // Right side burst
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 0.8, y: 0.8 },
          colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"],
          gravity: 0.8,
          ticks: 200,
        });
      };

      // Fire initial burst
      burst();

      // Additional smaller bursts over time (like confetti falling)
      const duration = 2000;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }

        // Random smaller bursts
        confetti({
          particleCount: 15,
          angle: 60 + Math.random() * 60,
          spread: 40,
          origin: { x: Math.random(), y: 0.7 + Math.random() * 0.2 },
          colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"],
          gravity: 0.8,
          ticks: 150,
        });
      }, 150);

      // Store interval for cleanup
      (window as any).__confettiInterval = interval;
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if ((window as any).__confettiInterval) {
        clearInterval((window as any).__confettiInterval);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      confettiFired.current = false;
      return;
    }
    async function fetchMilestones() {
      try {
        const data = await getProjectMilestones(projectId);
        setMilestones(data.active.slice(0, 5)); // Show first 5 milestones
      } catch (err) {
        // Silently handle 404s (project might not exist yet or was deleted)
        if (err instanceof Error && (err.message.includes("404") || err.message.includes("not found"))) {
          // Project doesn't exist, set empty milestones
          setMilestones([]);
        } else {
          console.error("Failed to fetch milestones:", err);
        }
      } finally {
        setLoadingMilestones(false);
      }
    }
    fetchMilestones();
  }, [isOpen, projectId]);

  // Navigate to project when modal closes (X button)
  const handleClose = () => {
    onClose();
    navigate(projectUrl);
  };

  const handleSeeProject = () => {
    onClose();
    navigate(projectUrl);
  };

  const preferences = usePreferences();
  const lengthStr = preferences?.formatDistance(totalLengthMeters, 1) ?? `${(totalLengthMeters / 1000).toFixed(1)} km`;
  const firstMilestone = milestones[0];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Project created" size="large">
      <div className="flex flex-col gap-5 text-base">
        {/* Celebration */}
        <div className="flex flex-col items-center gap-3 relative">
          <div className="relative z-10">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-4xl text-surface shadow-lg"
              aria-hidden
            >
              ✓
            </span>
          </div>
          <div className="text-center z-10">
            <h2 className="text-xl font-bold text-text mb-1">You're all set!</h2>
            <p className="text-text-muted text-sm">
              <strong className="text-text">{totalStreets}</strong> streets to explore across{" "}
              <strong className="text-text">{lengthStr}</strong>
            </p>
          </div>
          {/* Confetti canvas will be rendered by canvas-confetti */}
        </div>

        {/* Small Wins First: First Milestone Highlight */}
        {firstMilestone && (
          <div className="rounded-lg border-2 border-primary bg-primary/10 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0" aria-hidden>
                🎯
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text mb-1">Your first goal:</p>
                <p className="text-lg font-bold text-primary mb-2">{firstMilestone.name}</p>
                <p className="text-sm text-text-muted">
                  Complete your first street to unlock this achievement!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* All Goals Preview */}
        {milestones.length > 1 && (
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="font-semibold text-text mb-3 flex items-center gap-2">
              <span aria-hidden>🏆</span>
              <span>Your goals ({milestones.length} total)</span>
            </p>
            <ul className="space-y-2">
              {milestones.slice(0, 4).map((m) => (
                <li key={m.id} className="flex items-center gap-2 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-full border-2 border-border flex items-center justify-center text-xs">
                    {m.currentValue >= m.targetValue ? "✓" : m.targetValue}
                  </span>
                  <span className={m.currentValue >= m.targetValue ? "text-success line-through" : "text-text"}>
                    {m.name}
                  </span>
                </li>
              ))}
              {milestones.length > 4 && (
                <li className="text-xs text-text-muted pl-7">
                  +{milestones.length - 4} more goals to discover
                </li>
              )}
            </ul>
          </div>
        )}

        {/* What to do next */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="mb-3 font-semibold text-text flex items-center gap-2">
            <span aria-hidden>💡</span>
            <span>What to do next:</span>
          </p>
          <ul className="space-y-2 text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5">🏃</span>
              <span>Go for a run — we'll track every street you cover automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5">📍</span>
              <span>Check "Your next run" for street suggestions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5">🔗</span>
              <span>Connect Strava to sync runs automatically</span>
            </li>
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            onClick={handleSeeProject}
            className="min-h-[48px] w-full"
          >
            See your project
          </Button>
          <div className="flex justify-center text-sm">
            <Link
              to={suggestionsUrl}
              onClick={onClose}
              className="text-primary hover:underline"
            >
              See suggested streets
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
