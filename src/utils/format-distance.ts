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
  switch (unit) {
    case "miles":
      return `${(meters / 1609.344).toFixed(precision)} mi`;
    case "meters":
      return `${Math.round(meters)} m`;
    case "km":
    default:
      if (meters < 1000) return `${Math.round(meters)} m`;
      return `${(meters / 1000).toFixed(precision)} km`;
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
