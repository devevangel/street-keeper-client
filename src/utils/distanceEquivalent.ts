/**
 * Maps a distance in km to a motivational equivalent string.
 * Returns null when km is below the first threshold.
 *
 * Copy uses globally recognized running-distance terms (10k, marathon, etc.) in km;
 * intentionally not localized to miles — revisit if product wants locale-specific phrasing.
 */

const EQUIVALENTS: Array<{ minKm: number; label: string }> = [
  { minKm: 422, label: "the length of Great Britain" },
  { minKm: 160, label: "London to Paris" },
  { minKm: 100, label: "an ultra-marathon" },
  { minKm: 42.2, label: "a marathon" },
  { minKm: 21.1, label: "a half marathon" },
  { minKm: 10, label: "a 10k" },
  { minKm: 5, label: "a 5k" },
  { minKm: 1.6, label: "a mile" },
];

export function getDistanceEquivalent(km: number): string | null {
  if (km < 1.6) return null;
  for (const eq of EQUIVALENTS) {
    if (km >= eq.minKm) {
      const times = km / eq.minKm;
      if (times >= 1.95) {
        return `${times.toFixed(1)}x ${eq.label}`;
      }
      return `~${eq.label}`;
    }
  }
  return null;
}
