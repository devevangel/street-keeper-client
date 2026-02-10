/**
 * Geocoding Service
 * Universal location search (addresses, places, POIs) via backend Nominatim proxy.
 */

import { apiClient } from "../lib/api-client";
import type { GeocodeResponse, GeocodingResult } from "../types/api.types";

export const geocodingService = {
  async search(
    query: string,
    options?: { limit?: number; countrycodes?: string }
  ): Promise<GeocodingResult[]> {
    if (!query.trim()) return [];
    const params: Record<string, string> = { q: query.trim() };
    if (options?.limit) params.limit = String(options.limit);
    if (options?.countrycodes) params.countrycodes = options.countrycodes;
    const res = await apiClient.get<GeocodeResponse>("/geocode", params);
    return res.results ?? [];
  },
};
