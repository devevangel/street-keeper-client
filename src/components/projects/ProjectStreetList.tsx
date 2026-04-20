/**
 * ProjectStreetList
 * Shows all streets in the project (total list the user has to run).
 * Groups segments by street name so "The Thicket" (4 ways) appears once with combined length and progress.
 * Optional search; summary shows total distance and overall progress.
 */

import { useState, useMemo } from "react";
import type { SnapshotStreet } from "../../types/api.types";
import { normalizeStreetName } from "../../utils/normalize-street-name";
import { useFormatters } from "../../contexts/PreferencesContext";
import { Input } from "../common";

interface ProjectStreetListProps {
  streets: SnapshotStreet[];
  totalStreets: number;
  /** Total length of all streets (km or m). If provided, shown in summary. */
  totalLengthMeters?: number;
  /** Overall project progress 0–100. If provided, shown in summary. */
  overallProgressPercent?: number;
  /** Called when a street row is clicked. Receives the grouped osmIds and display name. */
  onStreetClick?: (osmIds: string[], name: string) => void;
}

/** One row after grouping by name: combined length, weighted % and status. */
interface GroupedStreet {
  name: string;
  osmIds: string[];
  totalLengthMeters: number;
  percentage: number;
  completed: boolean;
  segmentCount: number;
}

function groupStreetsByName(streets: SnapshotStreet[]): GroupedStreet[] {
  const byName = new Map<string, { streets: SnapshotStreet[]; displayName: string }>();
  for (const s of streets) {
    const key = normalizeStreetName(s.name || "Unnamed");
    if (!byName.has(key)) {
      // Use the first encountered name as display name
      byName.set(key, { streets: [], displayName: s.name || "Unnamed" });
    }
    byName.get(key)!.streets.push(s);
  }
  const result: GroupedStreet[] = [];
  for (const data of byName.values()) {
    const ways = data.streets;
    const totalLengthMeters = ways.reduce((sum, w) => sum + w.lengthMeters, 0);
    const weightedPct =
      totalLengthMeters > 0
        ? ways.reduce((sum, w) => sum + w.percentage * w.lengthMeters, 0) /
          totalLengthMeters
        : 0;
    const completed = ways.every((w) => w.completed);
    result.push({
      name: data.displayName,
      osmIds: ways.map((w) => w.osmId),
      totalLengthMeters,
      percentage: Math.round(weightedPct),
      completed,
      segmentCount: ways.length,
    });
  }
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

function statusLabel(row: GroupedStreet): string {
  if (row.completed) return "Completed";
  if (row.percentage > 0) return "In progress";
  return "Not started";
}

function statusClass(row: GroupedStreet): string {
  if (row.completed) return "bg-success/20 text-success";
  if (row.percentage > 0) return "bg-warning/20 text-warning";
  return "bg-border text-text-muted";
}

export function ProjectStreetList({
  streets,
  totalStreets: _totalStreets,
  totalLengthMeters,
  overallProgressPercent,
  onStreetClick,
}: ProjectStreetListProps) {
  const [search, setSearch] = useState("");
  const { formatDistance } = useFormatters();

  const grouped = useMemo(() => groupStreetsByName(streets), [streets]);

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.trim().toLowerCase();
    return grouped.filter((g) => g.name.toLowerCase().includes(q));
  }, [grouped, search]);

  const totalMeters =
    totalLengthMeters != null
      ? totalLengthMeters
      : streets.reduce((sum, s) => sum + s.lengthMeters, 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">
        {grouped.length} street{grouped.length !== 1 ? "s" : ""} in this project
        {streets.length !== grouped.length &&
          ` (${streets.length} segments)`}.
        {" · "}
        Total: {formatDistance(totalMeters, 1)}
        {overallProgressPercent != null &&
          ` · Overall: ${Math.round(overallProgressPercent)}% complete`}
      </p>
      <Input
        type="search"
        placeholder="Search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search streets"
      />
      <div
        className="max-h-[60vh] overflow-y-auto rounded-lg border border-border"
        aria-label="All streets in this project"
      >
        <ul className="list-none divide-y divide-border p-0">
          {filtered.map((row) => (
            <li
              key={row.name}
              className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 even:bg-border/5${
                onStreetClick ? " cursor-pointer hover:bg-border/10" : ""
              }`}
              role={onStreetClick ? "button" : undefined}
              tabIndex={onStreetClick ? 0 : undefined}
              onClick={
                onStreetClick
                  ? () => onStreetClick(row.osmIds, row.name)
                  : undefined
              }
              onKeyDown={
                onStreetClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onStreetClick(row.osmIds, row.name);
                      }
                    }
                  : undefined
              }
            >
              <span className="font-medium text-text">
                {row.name}
                {row.segmentCount > 1 && (
                  <span className="ml-1.5 text-text-muted text-xs font-normal">
                    ({row.segmentCount} parts)
                  </span>
                )}
              </span>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-text-muted">
                  {formatDistance(row.totalLengthMeters, 2)}
                </span>
                <span className="text-text-muted">{row.percentage}%</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${statusClass(row)}`}
                >
                  {statusLabel(row)}
                </span>
              </div>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && (
          <p className="p-4 text-center text-text-muted text-sm">
            No streets match your search.
          </p>
        )}
      </div>
    </div>
  );
}
