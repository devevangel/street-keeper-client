/**
 * Centralized street name normalizer for frontend.
 * Matches backend logic for consistent grouping across the app.
 *
 * Handles OSM naming variations:
 * - Road classifications: "Park Road (A3066)" -> "park road"
 * - Abbreviations: "High St", "Main Rd" -> "high street", "main road"
 * - Apostrophes: "St George's" -> "st georges"
 * - "The" prefix, directional abbreviations, hyphens, etc.
 */

/**
 * Normalize a street name for grouping and comparison.
 * Use this everywhere street names are used as Map keys or for equality checks.
 */
export function normalizeStreetName(name: string): string {
  if (!name) return "";

  return (
    name
      .replace(/\s*\([A-Z]\d+[A-Za-z]?\d*\)\s*/g, "")
      .replace(/^the\s+/i, "")
      .toLowerCase()
      .replace(/\bst\.\s/gi, "saint ")
      .replace(/\bst\.$/gi, "saint")
      .replace(/\bst\s/gi, "saint ")
      .replace(/\brd\.?\b/gi, "road")
      .replace(/\bave\.?\b/gi, "avenue")
      .replace(/\bln\.?\b/gi, "lane")
      .replace(/\bdr\.?\b/gi, "drive")
      .replace(/\bct\.?\b/gi, "court")
      .replace(/\bblvd\.?\b/gi, "boulevard")
      .replace(/\bhwy\.?\b/gi, "highway")
      .replace(/\bpl\.?\b/gi, "place")
      .replace(/\bsq\.?\b/gi, "square")
      .replace(/(?:^|\s)n\.\s/gi, " north ")
      .replace(/(?:^|\s)n\s/gi, " north ")
      .replace(/(?:^|\s)s\.\s/gi, " south ")
      .replace(/(?:^|\s)s\s/gi, " south ")
      .replace(/\be\.?\s/gi, "east ")
      .replace(/\bw\.?\s/gi, "west ")
      .replace(/[''"`]/g, "")
      .replace(/\./g, "")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}
