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
  CreateProjectRequest,
} from "../types/api.types";

export const projectsService = {
  async getAll(): Promise<ProjectsListResponse> {
    return apiClient.get<ProjectsListResponse>("/projects");
  },

  async getById(projectId: string): Promise<ProjectDetailResponse> {
    return apiClient.get<ProjectDetailResponse>(`/projects/${projectId}`);
  },

  async preview(
    centerLat: number,
    centerLng: number,
    radiusMeters: 500 | 1000 | 2000 | 5000 | 10000
  ): Promise<ProjectPreviewResponse> {
    return apiClient.get<ProjectPreviewResponse>("/projects/preview", {
      lat: centerLat.toString(),
      lng: centerLng.toString(),
      radius: radiusMeters.toString(),
    });
  },

  async create(data: CreateProjectRequest): Promise<ProjectDetailResponse> {
    return apiClient.post<ProjectDetailResponse>("/projects", data);
  },

  async delete(projectId: string): Promise<{ success: true; message: string }> {
    return apiClient.delete(`/projects/${projectId}`);
  },

  async refresh(projectId: string): Promise<ProjectDetailResponse> {
    return apiClient.post<ProjectDetailResponse>(
      `/projects/${projectId}/refresh`
    );
  },

  async getMap(projectId: string): Promise<ProjectMapResponse> {
    return apiClient.get<ProjectMapResponse>(`/projects/${projectId}/map`);
  },
};
