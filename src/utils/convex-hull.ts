/**
 * Convex hull (Andrew's monotone chain) + fixed-distance buffer for map polygons.
 * Points are [lat, lng] pairs throughout.
 */

function cross(o: [number, number], a: [number, number], b: [number, number]): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/** Compute the convex hull of a set of [lat, lng] points (monotone chain). */
export function convexHull(points: [number, number][]): [number, number][] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length <= 2) return pts;

  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * Expand each hull vertex outward from the centroid by a fixed distance.
 * Uses normalized direction vectors so the buffer is consistent regardless of shape.
 */
export function bufferHull(hull: [number, number][], bufferMeters: number = 30): [number, number][] {
  if (hull.length === 0) return hull;

  const centroidLat = hull.reduce((s, p) => s + p[0], 0) / hull.length;
  const centroidLng = hull.reduce((s, p) => s + p[1], 0) / hull.length;

  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = 111_320 * Math.cos((centroidLat * Math.PI) / 180);

  return hull.map(([lat, lng]) => {
    const dLat = lat - centroidLat;
    const dLng = lng - centroidLng;
    const distDeg = Math.sqrt(dLat * dLat + dLng * dLng);

    if (distDeg < 1e-10) return [lat, lng] as [number, number];

    const normLat = dLat / distDeg;
    const normLng = dLng / distDeg;

    const bufferLat = bufferMeters / metersPerDegreeLat;
    const bufferLng = bufferMeters / metersPerDegreeLng;

    return [
      lat + normLat * bufferLat,
      lng + normLng * bufferLng,
    ] as [number, number];
  });
}

/** Rectangle from [minLat, minLng, maxLat, maxLng] as closed ring for Leaflet Polygon. */
export function bboxToPolygonRing(bbox: [number, number, number, number]): [number, number][] {
  const [minLat, minLng, maxLat, maxLng] = bbox;
  return [
    [minLat, minLng],
    [minLat, maxLng],
    [maxLat, maxLng],
    [maxLat, minLng],
  ];
}
