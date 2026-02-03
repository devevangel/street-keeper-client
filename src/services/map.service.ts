/**
 * Map Service
 * Fetches street progress with geometry for the home page map view.
 * Uses GET /api/v1/map/streets (see backend docs/MAP_FEATURE.md).
 */

import { apiClient } from "../lib/api-client";
import type { MapStreetsResponse } from "../types/api.types";

export const mapService = {
  /**
   * Get streets the user has run on in the given area.
   * Requires authentication (x-user-id or session).
   *
   * @param lat - Center latitude (-90 to 90)
   * @param lng - Center longitude (-180 to 180)
   * @param radiusMeters - Optional radius in meters (100–10000, backend default 2000)
   * @returns Streets with geometry, status (completed/partial), and stats
   */
  async getStreets(
    lat: number,
    lng: number,
    radiusMeters?: number
  ): Promise<MapStreetsResponse> {
    const params: Record<string, string> = {
      lat: String(lat),
      lng: String(lng),
    };
    if (radiusMeters != null) {
      params.radius = String(radiusMeters);
    }
    return apiClient.get<MapStreetsResponse>("/map/streets", params);
  },
};
