/**
 * Shared map utilities for project and homepage map views.
 */

import type { ProjectMapData, ProjectMapStreet } from "../types/api.types";

/** Normalize osmId to "way/..." for consistent map highlighting */
export function normalizeOsmId(osmId: string): string {
  return osmId.startsWith("way/") ? osmId : `way/${osmId}`;
}

/** Compute bounding box from street geometries for fitBounds. Returns [minLat, minLng, maxLat, maxLng]. */
export function computeBboxFromStreets(
  streets: ProjectMapStreet[]
): [number, number, number, number] {
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;
  for (const s of streets) {
    const coords = s.geometry?.coordinates ?? [];
    for (const [lng, lat] of coords) {
      if (lat < minLat) minLat = lat;
      if (lng < minLng) minLng = lng;
      if (lat > maxLat) maxLat = lat;
      if (lng > maxLng) maxLng = lng;
    }
  }
  if (minLat === Infinity) return [0, 0, 0, 0];
  return [minLat, minLng, maxLat, maxLng];
}

/** Compute bounding box from boundary for fitting map view */
export function computeBoundaryBbox(
  boundary: ProjectMapData["boundary"]
): [number, number, number, number] | null {
  if (boundary.type === "circle") {
    const { center, radiusMeters } = boundary;
    const latDeg = radiusMeters / 111320;
    const lngDeg = radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));
    return [
      center.lat - latDeg,
      center.lng - lngDeg,
      center.lat + latDeg,
      center.lng + lngDeg,
    ];
  }
  const coords = boundary.coordinates;
  if (!coords.length) return null;
  let minLat = coords[0][1];
  let maxLat = coords[0][1];
  let minLng = coords[0][0];
  let maxLng = coords[0][0];
  for (const [lng, lat] of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return [minLat, minLng, maxLat, maxLng];
}

/** Get map center from project map data (boundary center or polygon centroid) */
export function projectMapCenter(mapData: ProjectMapData): { lat: number; lng: number } {
  const b = mapData.boundary;
  if (b.type === "circle") return b.center;
  const coords = b.coordinates;
  if (!coords.length) return { lat: 50.8, lng: -1.09 };
  const sum = coords.reduce(
    (a, p) => [a[0] + p[0], a[1] + p[1]],
    [0, 0]
  );
  return { lat: sum[1] / coords.length, lng: sum[0] / coords.length };
}
