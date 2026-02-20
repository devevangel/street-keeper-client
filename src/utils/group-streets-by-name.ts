import type { SnapshotStreet, ProjectMapStreet } from "../types/api.types";
import { normalizeStreetName } from "./normalize-street-name";

export interface GroupedStreet {
  name: string;
  percentage: number;
  completed: boolean;
  osmIds: string[];
}

/** Group streets by name and include all osmIds for highlighting all segments. */
export function groupStreetsByName(streets: SnapshotStreet[]): GroupedStreet[] {
  const byName = new Map<
    string,
    { streets: SnapshotStreet[]; displayName: string }
  >();
  for (const s of streets) {
    const key = normalizeStreetName(s.name || "Unnamed");
    if (!byName.has(key)) {
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
      percentage: Math.round(weightedPct),
      completed,
      osmIds: ways.map((w) => w.osmId),
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
    const key = normalizeStreetName(s.name || "Unnamed");
    if (!byName.has(key)) {
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
    const completed = ways.every((w) => w.status === "completed");
    result.push({
      name: data.displayName,
      percentage: Math.round(weightedPct),
      completed,
      osmIds: ways.map((w) => w.osmId),
    });
  }
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
