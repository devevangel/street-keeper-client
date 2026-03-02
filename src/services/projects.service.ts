/**
 * Projects Service
 * CRUD and preview for projects. Uses API client for backend calls.
 */

import { apiClient } from "../lib/api-client";
import type {
  ProjectsListResponse,
  ProjectDetailResponse,
  ProjectPreviewResponse,
  ProjectMapResponse,
  ProjectHeatmapResponse,
  ProjectActivitiesResponse,
  CreateProjectRequest,
} from "../types/api.types";

export const projectsService = {
  async getAll(options?: {
    includeArchived?: boolean;
  }): Promise<ProjectsListResponse> {
    const params: Record<string, string> = {};
    if (options?.includeArchived) params.includeArchived = "true";
    return apiClient.get<ProjectsListResponse>("/projects", params);
  },

  async getById(
    projectId: string,
    options?: { includeStreets?: boolean },
  ): Promise<ProjectDetailResponse> {
    const params =
      options?.includeStreets === true ? { include: "streets" } : undefined;
    return apiClient.get<ProjectDetailResponse>(
      `/projects/${projectId}`,
      params as Record<string, string> | undefined,
    );
  },

  async preview(
    options:
      | {
          boundaryType: "circle";
          centerLat: number;
          centerLng: number;
          radiusMeters: number;
        }
      | {
          boundaryType: "polygon";
          polygonCoordinates: [number, number][];
        },
    boundaryMode?: "centroid" | "strict" | "intersects",
    includeStreets?: boolean,
    signal?: AbortSignal,
  ): Promise<ProjectPreviewResponse> {
    const params: Record<string, string> = {};
    if (options.boundaryType === "circle") {
      params.lat = options.centerLat.toString();
      params.lng = options.centerLng.toString();
      params.radius = options.radiusMeters.toString();
    } else {
      params.boundaryType = "polygon";
      params.polygon = JSON.stringify(options.polygonCoordinates);
    }
    if (boundaryMode === "strict") params.boundaryMode = "strict";
    else if (boundaryMode === "centroid") params.boundaryMode = "centroid";
    else if (boundaryMode === "intersects") params.boundaryMode = "intersects";
    if (includeStreets === true) params.includeStreets = "true";
    return apiClient.get<ProjectPreviewResponse>("/projects/preview", params, signal);
  },

  async create(data: CreateProjectRequest): Promise<ProjectDetailResponse> {
    return apiClient.post<ProjectDetailResponse>("/projects", data);
  },

  async archive(projectId: string): Promise<{ success: true; message: string }> {
    return apiClient.delete(`/projects/${projectId}`);
  },

  async restore(projectId: string): Promise<{ success: true; message: string }> {
    return apiClient.post(`/projects/${projectId}/restore`);
  },

  async deletePermanently(
    projectId: string
  ): Promise<{ success: true; message: string }> {
    return apiClient.delete(`/projects/${projectId}/permanent`);
  },

  async refresh(projectId: string): Promise<ProjectDetailResponse> {
    return apiClient.post<ProjectDetailResponse>(
      `/projects/${projectId}/refresh`,
    );
  },

  async resize(
    projectId: string,
    radiusMeters: number,
  ): Promise<ProjectDetailResponse> {
    return apiClient.patch<ProjectDetailResponse>(`/projects/${projectId}`, {
      radiusMeters,
    });
  },

  async getMap(projectId: string): Promise<ProjectMapResponse> {
    return apiClient.get<ProjectMapResponse>(`/projects/${projectId}/map`);
  },

  async getHeatmap(projectId: string): Promise<ProjectHeatmapResponse> {
    return apiClient.get<ProjectHeatmapResponse>(
      `/projects/${projectId}/heatmap`,
    );
  },

  async getActivities(projectId: string): Promise<ProjectActivitiesResponse> {
    return apiClient.get<ProjectActivitiesResponse>(
      `/projects/${projectId}/activities`,
    );
  },
};
