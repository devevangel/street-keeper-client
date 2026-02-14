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
  async getAll(): Promise<ProjectsListResponse> {
    return apiClient.get<ProjectsListResponse>("/projects");
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
    centerLat: number,
    centerLng: number,
    radiusMeters: 100 | 200 | 500 | 1000 | 2000 | 5000 | 10000,
    boundaryMode?: "centroid" | "strict",
  ): Promise<ProjectPreviewResponse> {
    const params: Record<string, string> = {
      lat: centerLat.toString(),
      lng: centerLng.toString(),
      radius: radiusMeters.toString(),
    };
    if (boundaryMode === "strict") params.boundaryMode = "strict";
    return apiClient.get<ProjectPreviewResponse>("/projects/preview", params);
  },

  async create(data: CreateProjectRequest): Promise<ProjectDetailResponse> {
    return apiClient.post<ProjectDetailResponse>("/projects", data);
  },

  async delete(projectId: string): Promise<{ success: true; message: string }> {
    return apiClient.delete(`/projects/${projectId}`);
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
