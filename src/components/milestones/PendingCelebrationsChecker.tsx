/**
 * PendingCelebrationsChecker Component (MVP)
 * Checks for pending celebrations on app load and shows them.
 * Optimized to only check once per session to reduce API calls.
 */

import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { projectsService } from "../../services/projects.service";
import { getProjectMilestones, acknowledgeMilestone } from "../../services/milestones.service";
import { CelebrationModal } from "./CelebrationModal";

// Session-level flag to prevent multiple checks across page navigations
let sessionChecked = false;

export function PendingCelebrationsChecker() {
  const { user } = useAuth();
  const [celebration, setCelebration] = useState<{
    id: string;
    name: string;
    projectName: string;
    shareMessage: string;
  } | null>(null);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only check once per session AND once per component mount
    if (!user || sessionChecked || hasChecked.current) return;
    hasChecked.current = true;
    sessionChecked = true;

    async function checkPendingCelebrations() {
      try {
        // Get all projects
        const response = await projectsService.getAll();
        const projects = response.projects || [];
        
        // Check each project for pending celebrations
        for (const project of projects) {
          try {
            const milestones = await getProjectMilestones(project.id);
            if (milestones.pendingCelebrations.length > 0) {
              // Show first pending celebration
              setCelebration(milestones.pendingCelebrations[0]);
              break; // Only show one at a time
            }
          } catch (err) {
            // Silently skip projects that don't exist (404) or fail
            if (err instanceof Error && (err.message.includes("404") || err.message.includes("not found"))) {
              // Project was deleted, skip silently
              continue;
            }
            // Log other errors but don't spam console
            console.warn(`Failed to check milestones for project ${project.id}:`, err);
          }
        }
      } catch (err) {
        console.error("Failed to check pending celebrations:", err);
      }
    }

    checkPendingCelebrations();
  }, [user]);

  const handleAcknowledge = async (milestoneId: string) => {
    try {
      await acknowledgeMilestone(milestoneId);
      setCelebration(null);
      // Allow checking for more celebrations after acknowledging
      hasChecked.current = false;
      sessionChecked = false;
    } catch (err) {
      console.error("Failed to acknowledge milestone:", err);
      throw err;
    }
  };

  const handleClose = () => {
    setCelebration(null);
  };

  if (!celebration) return null;

  return (
    <CelebrationModal
      milestone={celebration}
      onClose={handleClose}
      onAcknowledge={handleAcknowledge}
    />
  );
}
