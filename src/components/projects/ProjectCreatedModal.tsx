/**
 * ProjectCreatedModal
 * Shown after successfully creating a project with quick summary and next-step CTAs.
 */

import { Link, useNavigate } from "react-router-dom";
import { Modal, Button } from "../common";
import { ROUTES } from "../../config/constants";
import { useFormatters } from "../../contexts/PreferencesContext";

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

  // Navigate to project when modal closes (X button)
  const handleClose = () => {
    onClose();
    navigate(projectUrl);
  };

  const handleSeeProject = () => {
    onClose();
    navigate(projectUrl);
  };

  const { formatDistance } = useFormatters();
  const lengthStr = formatDistance(totalLengthMeters, 1);

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
        </div>

        {/* What to do next */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="mb-3 font-semibold text-text flex items-center gap-2">
            <span aria-hidden>💡</span>
            <span>What to do next:</span>
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-text-muted marker:font-medium marker:text-text">
            <li className="pl-1">
              Go for a run in the Strava app — we&apos;ll track every street you cover automatically
            </li>
            <li className="pl-1">
              Check &quot;Your next run&quot; for street suggestions
            </li>
          </ol>
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
