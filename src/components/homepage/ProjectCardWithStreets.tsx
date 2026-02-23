/**
 * ProjectCardWithStreets
 * Project card with collapsible streets list. Streets are fetched when the user expands.
 * Clicking a street focuses the map on the project area and highlights all segments of that street.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../common/Card";
import { MetricBlock } from "../common/MetricBlock";
import { StreetListItem, type StreetListItemData } from "../common";
import { projectsService } from "../../services/projects.service";
import { ROUTES } from "../../config/constants";
import type { ProjectListItem, SnapshotStreet } from "../../types/api.types";
import { groupStreetsByName } from "../../utils/group-streets-by-name";
import { getStreetBin, type FilterStatus } from "../../utils/street-filters";

interface ProjectCardWithStreetsProps {
  project: ProjectListItem;
  activeFilter?: FilterStatus;
  onStreetClick: (params: {
    project: ProjectListItem;
    streetName: string;
    osmIds: string[];
  }) => void;
  onStreetBlur?: () => void;
  onBinCountsReport?: (projectId: string, counts: { completed: number; almostThere: number; inProgress: number; notStarted: number }) => void;
}

export function ProjectCardWithStreets({
  project,
  activeFilter = "all",
  onStreetClick,
  onStreetBlur,
  onBinCountsReport,
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

  const grouped = useMemo(() => groupStreetsByName(streets), [streets]);

  // Compute bin counts and report to parent when streets change
  const binCounts = useMemo(() => {
    const counts = { completed: 0, almostThere: 0, inProgress: 0, notStarted: 0 };
    for (const g of grouped) {
      const bin = getStreetBin(g.percentage, g.completed);
      if (bin !== "all") counts[bin]++;
    }
    return counts;
  }, [grouped]);

  // Report bin counts to parent only when streets array changes (not on every render)
  const streetsKey = streets.map(s => s.osmId).join(",");
  useEffect(() => {
    if (streets.length > 0 && onBinCountsReport) {
      const counts = { completed: 0, almostThere: 0, inProgress: 0, notStarted: 0 };
      const grp = groupStreetsByName(streets);
      for (const g of grp) {
        const bin = getStreetBin(g.percentage, g.completed);
        if (bin !== "all") counts[bin]++;
      }
      onBinCountsReport(project.id, counts);
    }
  }, [project.id, streetsKey, onBinCountsReport]);

  const filtered = activeFilter === "all"
    ? grouped
    : grouped.filter((g) => getStreetBin(g.percentage, g.completed) === activeFilter);

  const incomplete = grouped.filter((g) => !g.completed);
  const incompleteCount = incomplete.length;
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
    <Card padding="sm" className="space-y-3">
      <div className="flex items-start justify-between">
        <button
          type="button"
          onClick={() => navigate(`${ROUTES.PROJECTS_LIST}/${project.id}`)}
          className="text-left text-base font-medium text-accent hover:underline"
        >
          {project.name}
        </button>
      </div>
      <div className="space-y-0.5">
        <MetricBlock
          label="Streets completed"
          value={completedNames}
          size="md"
        />
        <span className="text-sm text-text-muted">
          of {totalNames} streets · {Math.round(project.progress)}%
        </span>
      </div>

      {/* Collapsible streets inside the card */}
      <details
        open={expanded}
        onToggle={(e) => setExpanded(e.currentTarget.open)}
        className="space-y-2"
      >
        <summary className="flex min-h-[44px] cursor-pointer items-center rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text-muted hover:text-text">
          Streets ({leftToComplete} to complete)
        </summary>
        {expanded && (
          <div className="mt-2 max-h-[40vh] overflow-y-auto border border-border bg-surface">
            {streetsLoading ? (
              <p className="px-4 py-3 text-sm text-text-muted">Loading streets…</p>
            ) : grouped.length === 0 ? (
              <p className="px-4 py-3 text-sm text-text-muted">No streets found</p>
            ) : (
              <ul className="list-none divide-y divide-border p-0">
                {filtered.map((row) => (
                  <StreetListItem
                    key={row.name}
                    street={row}
                    onHighlight={handleStreetHighlight}
                    onClearHighlight={handleStreetClear}
                    variant="homepage"
                  />
                ))}
                {filtered.length === 0 && (
                  <li className="px-4 py-3 text-sm text-text-muted">
                    {activeFilter === "all" ? "No streets found" : "No streets in this category"}
                  </li>
                )}
                {activeFilter === "all" && incompleteCount === 0 && grouped.length > 0 && (
                  <li className="px-4 py-3 text-sm text-text-muted">
                    All streets completed!
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </details>
    </Card>
  );
}
