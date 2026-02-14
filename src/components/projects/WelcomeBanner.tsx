/**
 * WelcomeBanner
 * Dismissible first-visit card for newly created projects. Shown when project
 * was created within the last 5 minutes and not yet dismissed.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../common";
import { ROUTES } from "../../config/constants";

const WELCOME_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY_PREFIX = "project-welcome-";

export interface WelcomeBannerProps {
  projectId: string;
  createdAt: string; // ISO date string
}

function getDismissedKey(projectId: string): string {
  return `${STORAGE_KEY_PREFIX}${projectId}`;
}

export function WelcomeBanner({ projectId, createdAt }: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(true); // start true to avoid flash

  useEffect(() => {
    if (localStorage.getItem(getDismissedKey(projectId)) === "dismissed") {
      setDismissed(true);
      return;
    }
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    setDismissed(now - created > WELCOME_WINDOW_MS);
  }, [projectId, createdAt]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(getDismissedKey(projectId), "dismissed");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  const suggestionsUrl = ROUTES.PROJECT_SUGGESTIONS.replace(":id", projectId);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded border-2 border-primary bg-primary/10 p-4">
      <div>
        <p className="font-medium text-text">
          Ready to start? Pick a street and go for a run.
        </p>
        <Link to={suggestionsUrl} className="mt-2 inline-block">
          <Button size="sm">See suggested streets</Button>
        </Link>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="min-h-[44px] min-w-[44px] rounded border-2 border-border bg-surface px-3 py-2 text-text hover:opacity-80"
        aria-label="Dismiss welcome message"
      >
        Dismiss
      </button>
    </div>
  );
}
