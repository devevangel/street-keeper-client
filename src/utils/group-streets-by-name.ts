import type { SnapshotStreet, ProjectMapStreet } from "../types/api.types";
import { normalizeStreetName } from "./normalize-street-name";
import { isUnnamedStreet } from "./street-filters";

export interface GroupedStreet {
  name: string;
  percentage: number;
  completed: boolean;
  osmIds: string[];
  /** Number of segments (ways) grouped under this street name */
  segmentCount: number;
  /** From UserStreetProgress (max across segments) */
  runCount?: number;
  /** From UserStreetProgress (latest across segments) */
  lastRunDate?: string | null;
}

/** Group streets by name and include all osmIds for highlighting all segments. */
export function groupStreetsByName(streets: SnapshotStreet[]): GroupedStreet[] {
  const byName = new Map<
    string,
    { streets: SnapshotStreet[]; displayName: string }
  >();
  for (const s of streets) {
    if (isUnnamedStreet(s.name)) continue;
    const key = normalizeStreetName(s.name);
    if (!byName.has(key)) {
      byName.set(key, { streets: [], displayName: s.name });
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
      percentage: Math.round(weightedPct),
      completed,
      osmIds: ways.map((w) => w.osmId),
      segmentCount: ways.length,
    });
  }
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

/** Group project map streets by name for sidebar display and highlighting. */
export function groupProjectMapStreetsByName(
  streets: ProjectMapStreet[]
): GroupedStreet[] {
  const byName = new Map<
    string,
    { streets: ProjectMapStreet[]; displayName: string }
  >();
  for (const s of streets) {
    if (isUnnamedStreet(s.name)) continue;
    const key = normalizeStreetName(s.name);
    if (!byName.has(key)) {
      byName.set(key, { streets: [], displayName: s.name });
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
    const completed = ways.every((w) => w.status === "completed");
    const runCount = ways.some((w) => w.runCount != null)
      ? Math.max(...ways.map((w) => w.runCount ?? 0))
      : undefined;
    const lastRunDate = ways.some((w) => w.lastRunDate != null)
      ? ways
          .map((w) => w.lastRunDate)
          .filter((d): d is string => d != null)
          .sort()
          .pop() ?? null
      : undefined;
    result.push({
      name: data.displayName,
      percentage: Math.round(weightedPct),
      completed,
      osmIds: ways.map((w) => w.osmId),
      segmentCount: ways.length,
      runCount,
      lastRunDate,
    });
  }
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
