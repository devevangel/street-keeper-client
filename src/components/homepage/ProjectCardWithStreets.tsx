/**
 * ProjectCardWithStreets
 * Project card with collapsible streets list. Streets are fetched when the user expands.
 * Clicking a street focuses the map on the project area and highlights all segments of that street.
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../common/Card";
import { StreetListItem, type StreetListItemData } from "../common";
import { projectsService } from "../../services/projects.service";
import { ROUTES } from "../../config/constants";
import type { ProjectListItem, SnapshotStreet } from "../../types/api.types";
import { groupStreetsByName } from "../../utils/group-streets-by-name";

interface ProjectCardWithStreetsProps {
  project: ProjectListItem;
  onStreetClick: (params: {
    project: ProjectListItem;
    streetName: string;
    osmIds: string[];
  }) => void;
  onStreetBlur?: () => void;
}

export function ProjectCardWithStreets({
  project,
  onStreetClick,
  onStreetBlur,
}: ProjectCardWithStreetsProps) {
  const navigate = useNavigate();
  const [streets, setStreets] = useState<SnapshotStreet[]>([]);
  const [streetsLoading, setStreetsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    let cancelled = false;
    setStreetsLoading(true);
    projectsService
      .getById(project.id, { includeStreets: true })
      .then((res) => {
        if (cancelled) return;
        const list = res.project.streets || [];
        list.sort((a, b) => {
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;
          return b.percentage - a.percentage;
        });
        setStreets(list);
      })
      .catch(() => {
        if (!cancelled) setStreets([]);
      })
      .finally(() => {
        if (!cancelled) setStreetsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project.id, expanded]);

  const grouped = groupStreetsByName(streets);
  const incomplete = grouped.filter((g) => !g.completed);
  const incompleteCount = incomplete.length;
  // When collapsed, use project stats for streets left to complete
  const totalNames = project.totalStreetNames ?? project.totalStreets;
  const completedNames = project.completedStreetNames ?? project.completedStreets;
  const leftToComplete = expanded ? incompleteCount : Math.max(0, totalNames - completedNames);

  const handleStreetHighlight = useCallback(
    (street: StreetListItemData) => {
      onStreetClick({
        project,
        streetName: street.name,
        osmIds: street.osmIds,
      });
    },
    [project, onStreetClick]
  );

  const handleStreetClear = useCallback(() => {
    onStreetBlur?.();
  }, [onStreetBlur]);

  return (
    <Card padding="sm" className="space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <button
            type="button"
            onClick={() => navigate(`${ROUTES.PROJECTS_LIST}/${project.id}`)}
            className="text-left text-sm font-medium text-accent hover:underline"
          >
            {project.name}
          </button>
        </div>
      </div>
      <div className="text-sm text-text-muted">
        {project.completedStreetNames ?? project.completedStreets} /{" "}
        {project.totalStreetNames ?? project.totalStreets} streets ·{" "}
        {Math.round(project.progress)}%
      </div>

      {/* Collapsible streets inside the card */}
      <details
        open={expanded}
        onToggle={(e) => setExpanded(e.currentTarget.open)}
        className="space-y-2"
      >
        <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted flex items-center min-h-[44px] hover:text-text">
          Streets ({leftToComplete} to complete)
        </summary>
        {expanded && (
          <Card padding="sm" className="mt-1 max-h-[40vh] space-y-1 overflow-y-auto">
            {streetsLoading ? (
              <p className="text-text-muted text-sm">Loading streets…</p>
            ) : grouped.length === 0 ? (
              <p className="text-text-muted text-sm">No streets found</p>
            ) : (
              <ul className="list-none divide-y divide-border space-y-0 p-0">
                {grouped
                  .filter((g) => !g.completed)
                  .map((row) => (
                    <StreetListItem
                      key={row.name}
                      street={row}
                      onHighlight={handleStreetHighlight}
                      onClearHighlight={handleStreetClear}
                      variant="homepage"
                    />
                  ))}
                {incompleteCount === 0 && (
                  <li className="px-3 py-2 text-sm text-text-muted">
                    All streets completed!
                  </li>
                )}
              </ul>
            )}
          </Card>
        )}
      </details>
    </Card>
  );
}
