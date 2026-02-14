/**
 * ProjectCreatedModal
 * Shown after successfully creating a project: celebration, street count, tips, and next-step CTAs.
 */

import { Link, useNavigate } from "react-router-dom";
import { Modal, Button } from "../common";
import { ROUTES } from "../../config/constants";

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
  const mapUrl = ROUTES.PROJECT_MAP.replace(":id", projectId);
  const suggestionsUrl = ROUTES.PROJECT_SUGGESTIONS.replace(":id", projectId);

  const handleSeeProject = () => {
    onClose();
    navigate(projectUrl);
  };

  const lengthKm = (totalLengthMeters / 1000).toFixed(1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project created" size="large">
      <div className="flex flex-col gap-4 text-base">
        <div className="flex justify-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-3xl text-surface"
            aria-hidden
          >
            ✓
          </span>
        </div>
        <p className="text-center text-text">
          You have <strong>{totalStreets}</strong> streets to explore across{" "}
          <strong>{lengthKm} km</strong>.
        </p>
        <hr className="border-border" />
        <div>
          <p className="mb-2 font-medium text-text">What to do next:</p>
          <ul className="list-inside list-disc space-y-1 text-text-muted text-sm">
            <li>Go for a run in your area — we will track every street you cover.</li>
            <li>Check &quot;Your next run&quot; for street suggestions.</li>
            <li>Connect Strava in settings to sync runs automatically.</li>
          </ul>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            onClick={handleSeeProject}
            className="min-h-[48px] w-full"
          >
            See your project
          </Button>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <Link
              to={mapUrl}
              onClick={onClose}
              className="text-primary hover:underline"
            >
              View streets on map
            </Link>
            <span className="text-text-muted">·</span>
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
