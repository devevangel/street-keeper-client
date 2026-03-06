/**
 * Distance formatting with unit support.
 * Backend stores everything in meters; conversion is client-side based on user preference.
 */

export type DistanceUnit = "km" | "miles" | "meters";

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
    case "miles":
      const miles = meters / 1609.344;
      return miles % 1 === 0 ? `${miles} mi` : `${miles.toFixed(1)} mi`;
    case "meters":
      return `${meters} m`;
    case "km":
    default:
      if (meters >= 1000) {
        const km = meters / 1000;
        return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
      }
      return `${meters} m`;
  }
}
