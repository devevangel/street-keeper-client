/**
 * Map Service
 * Fetches street progress with geometry for the home page map view.
 * When VITE_GPX_ENGINE=v2, uses GET /engine-v2/map/streets (UserEdge progress).
 * Otherwise uses GET /api/v1/map/streets (see backend docs/MAP_FEATURE.md).
 */

import { apiClient } from "../lib/api-client";
import { GPX_ENGINE } from "../config/constants";
import type { MapStreetsResponse, GpsTracesResponse } from "../types/api.types";

const MAP_STREETS_ENDPOINT =
  GPX_ENGINE === "v2" ? "/engine-v2/map/streets" : "/map/streets";

export const mapService = {
  /**
   * Get streets the user has run on in the given area.
   * Requires authentication (x-user-id or session).
   * Uses v2 endpoint when VITE_GPX_ENGINE=v2 (UserEdge-based progress).
   *
   * @param lat - Center latitude (-90 to 90)
   * @param lng - Center longitude (-180 to 180)
   * @param radiusMeters - Optional radius in meters (100–10000, backend default 2000)
   * @returns Streets with geometry, status (completed/partial), and stats
   */
  async getStreets(
    lat: number,
    lng: number,
    radiusMeters?: number,
    signal?: AbortSignal
  ): Promise<MapStreetsResponse> {
    const params: Record<string, string> = {
      lat: String(lat),
      lng: String(lng),
      minProgress: "0", // Include 0% segments so street aggregation sees full street
    };
    if (radiusMeters != null) {
      params.radius = String(radiusMeters);
    }
    return apiClient.get<MapStreetsResponse>(MAP_STREETS_ENDPOINT, params, signal);
  },

  /**
   * Get simplified GPS traces for the user's activities in an area.
   * @param lat - Center latitude
   * @param lng - Center longitude
   * @param radiusMeters - Optional radius in meters (default 5000)
   */
  async getTraces(
    lat: number,
    lng: number,
    radiusMeters?: number,
    signal?: AbortSignal
  ): Promise<GpsTracesResponse> {
    const params: Record<string, string> = {
      lat: String(lat),
      lng: String(lng),
    };
    if (radiusMeters != null) {
      params.radius = String(radiusMeters);
    }
    return apiClient.get<GpsTracesResponse>("/map/traces", params, signal);
  },

  /**
   * Get simplified GPS traces for activities linked to a project.
   */
  async getProjectTraces(projectId: string, signal?: AbortSignal): Promise<GpsTracesResponse> {
    return apiClient.get<GpsTracesResponse>(`/projects/${projectId}/traces`, undefined, signal);
  },
};
