/**
 * Distance formatting with unit support.
 * Backend stores everything in meters; conversion is client-side based on user preference.
 */

export type DistanceUnit = "km" | "miles" | "meters";

/** Default when preferences are not loaded yet — matches backend default. */
export const DEFAULT_DISTANCE_UNIT: DistanceUnit = "km";

export function formatDistance(
  meters: number,
  unit: DistanceUnit,
  precision = 1,
): string {
  // Render strictly in the user-preferred unit regardless of magnitude.
  // Auto-switching to meters when a km/miles value happens to be < 1 leads
  // to inconsistent displays like "675 m / 9.4 km" in the same card.
  switch (unit) {
    case "miles": {
      const miles = meters / 1609.344;
      const p = miles > 0 && miles < 0.1 ? Math.max(precision, 2) : precision;
      return `${miles.toFixed(p)} mi`;
    }
    case "meters":
      return `${Math.round(meters)} m`;
    case "km":
    default: {
      const km = meters / 1000;
      // Keep at least 2 decimals for sub-kilometre distances so we don't
      // print a misleading "0.0 km" for a 30-metre street segment.
      const p = km > 0 && km < 1 ? Math.max(precision, 2) : precision;
      return `${km.toFixed(p)} km`;
    }
  }
}

export function formatRadius(meters: number, unit: DistanceUnit): string {
  switch (unit) {
    case "miles": {
      const miles = meters / 1609.344;
      return miles >= 1 && miles % 1 === 0
        ? `${miles} mi`
        : `${miles.toFixed(2).replace(/\.?0+$/, "")} mi`;
    }
    case "meters":
      return `${meters} m`;
    case "km":
    default: {
      const km = meters / 1000;
      return km >= 1 && km % 1 === 0
        ? `${km} km`
        : `${km.toFixed(2).replace(/\.?0+$/, "")} km`;
    }
  }
}

/**
 * Short lengths (street segment, "X away"): same rules as formatDistance.
 * Use for inline labels like "500 m long · 300 m away".
 */
export function formatLength(
  meters: number,
  unit: DistanceUnit,
  precision = 1,
): string {
  return formatDistance(meters, unit, precision);
}
