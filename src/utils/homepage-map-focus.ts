/**
 * Map focus helpers for homepage suggestions (numeric OSM ids vs segment osmId strings).
 */
import type { MapStreet } from "../types/api.types";
import { normalizeOsmId } from "./map-utils";

export function matchStreetIdsToOsmIds(
  streetIds: number[] | undefined,
  streets: MapStreet[],
): string[] {
  if (!streetIds?.length) return [];
  const out: string[] = [];
  for (const nid of streetIds) {
    for (const s of streets) {
      const raw = s.osmId.replace(/^way\//, "");
      const parsed = parseInt(raw, 10);
      if (parsed === nid || s.osmId === String(nid)) {
        out.push(normalizeOsmId(s.osmId));
        break;
      }
    }
  }
  return out;
}

export function isValidBbox(bbox: [number, number, number, number] | undefined): boolean {
  if (!bbox || bbox.length !== 4) return false;
  const [a, b, c, d] = bbox;
  return (
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    Number.isFinite(c) &&
    Number.isFinite(d) &&
    !(a === 0 && b === 0 && c === 0 && d === 0) &&
    c > a &&
    d > b
  );
}
