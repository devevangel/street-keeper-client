/**
 * Routes Service
 * CRUD and preview for routes. Uses API client for backend calls.
 */

import { apiClient } from "../lib/api-client";
import type {
  RoutesListResponse,
  RouteDetailResponse,
  RoutePreviewResponse,
  CreateRouteRequest,
} from "../types/api.types";

export const routesService = {
  async getAll(): Promise<RoutesListResponse> {
    return apiClient.get<RoutesListResponse>("/routes");
  },

  async getById(routeId: string): Promise<RouteDetailResponse> {
    return apiClient.get<RouteDetailResponse>(`/routes/${routeId}`);
  },

  async preview(
    centerLat: number,
    centerLng: number,
    radiusMeters: 500 | 1000 | 2000 | 5000 | 10000
  ): Promise<RoutePreviewResponse> {
    return apiClient.get<RoutePreviewResponse>("/routes/preview", {
      lat: centerLat.toString(),
      lng: centerLng.toString(),
      radius: radiusMeters.toString(),
    });
  },

  async create(data: CreateRouteRequest): Promise<RouteDetailResponse> {
    return apiClient.post<RouteDetailResponse>("/routes", data);
  },

  async delete(routeId: string): Promise<{ success: true; message: string }> {
    return apiClient.delete(`/routes/${routeId}`);
  },

  async refresh(routeId: string): Promise<RouteDetailResponse> {
    return apiClient.post<RouteDetailResponse>(`/routes/${routeId}/refresh`);
  },
};
