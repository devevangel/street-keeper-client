/**
 * SuggestionsPanel
 * "Your next run" section: almost complete, nearest gaps, milestone, link to suggestions map.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "../common";
import { suggestionsService } from "../../services/suggestions.service";
import { ROUTES } from "../../config/constants";
import type { StreetSuggestion } from "../../types/api.types";

interface SuggestionsData {
  almostComplete: StreetSuggestion[];
  nearest: StreetSuggestion[];
  milestone: {
    target: number;
    currentProgress: number;
    streetsNeeded: number;
    streets: StreetSuggestion[];
  } | null;
  clusters?: Array<{
    centroid: { lat: number; lng: number };
    streets: StreetSuggestion[];
    totalLength: number;
    streetCount: number;
  }>;
}

export function SuggestionsPanel() {
  const { id: projectId } = useParams<{ id: string }>();
  const [data, setData] = useState<SuggestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    suggestionsService
      .getSuggestions(projectId, { maxResults: 2 })
      .then((s) => {
        if (!cancelled) setData(s);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load suggestions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (!projectId) return null;
  if (loading && !data) {
    return (
      <Card className="mb-4">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-text-muted">
          Your next run
        </h3>
        <p className="text-sm text-text-muted">Loading suggestions…</p>
      </Card>
    );
  }
  if (error) {
    return (
      <Card className="mb-4">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-text-muted">
          Your next run
        </h3>
        <p className="text-sm text-danger">{error}</p>
      </Card>
    );
  }
  if (!data) return null;

  const hasAny =
    data.almostComplete.length > 0 ||
    data.nearest.length > 0 ||
    (data.milestone && data.milestone.streets.length > 0) ||
    (data.clusters?.length ?? 0) > 0;

  if (!hasAny) {
    return (
      <Card className="mb-4">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-text-muted">
          Your next run
        </h3>
        <p className="text-sm text-text-muted">
          All streets in this project have been run. Great job!
        </p>
        <Link
          to={ROUTES.PROJECT_SUGGESTIONS.replace(":id", projectId)}
          className="mt-2 inline-block text-sm text-primary hover:underline"
        >
          View map
        </Link>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
        Your next run
      </h3>

      {data.almostComplete.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase text-text-muted">
            Almost done (finish these!)
          </p>
          <ul className="list-inside list-disc text-sm text-text">
            {data.almostComplete.slice(0, 2).map((s) => (
              <li key={s.osmId}>
                {s.name} — {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.nearest.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase text-text-muted">
            Nearest unrun streets
          </p>
          <ul className="list-inside list-disc text-sm text-text">
            {data.nearest.slice(0, 2).map((s) => (
              <li key={s.osmId}>
                {s.name} — {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.milestone && data.milestone.streets.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase text-text-muted">
            {data.milestone.streetsNeeded} street(s) to reach{" "}
            {data.milestone.target}%
          </p>
          <ul className="list-inside list-disc text-sm text-text">
            {data.milestone.streets.slice(0, 5).map((s) => (
              <li key={s.osmId}>{s.name}</li>
            ))}
          </ul>
          {data.milestone.streetsNeeded > data.milestone.streets.length && (
            <p className="mt-1 text-xs text-text-muted">
              Plus{" "}
              {data.milestone.streetsNeeded - data.milestone.streets.length}{" "}
              more
              {" — "}
              <Link
                to={ROUTES.PROJECT_SUGGESTIONS.replace(":id", projectId)}
                className="text-primary hover:underline"
              >
                view on map
              </Link>
            </p>
          )}
        </div>
      )}

      <Link
        to={ROUTES.PROJECT_SUGGESTIONS.replace(":id", projectId)}
        className="inline-block text-sm font-medium text-primary hover:underline"
      >
        View suggestions on map
      </Link>
    </Card>
  );
}
