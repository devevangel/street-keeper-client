/**
 * Projects Service
 * CRUD and preview for projects. Uses API client for backend calls.
 */

import { apiClient } from "../lib/api-client";
import type {
  ProjectsListResponse,
  ProjectDetailResponse,
  ProjectDetail,
  ProjectPreviewResponse,
  ProjectMapResponse,
  ProjectHeatmapResponse,
  ProjectActivitiesResponse,
  CreateProjectRequest,
} from "../types/api.types";

// Module-level cache and request deduplication for getAll
let getAllCache: { data: ProjectsListResponse; at: number; key: string } | null = null;
let getAllInProgress: Promise<ProjectsListResponse> | null = null;
const GET_ALL_CACHE_MS = 30 * 1000; // 30 seconds cache

function getAllCacheKey(options?: { includeArchived?: boolean }): string {
  return options?.includeArchived ? "all" : "active";
}

/**
 * Invalidate the projects cache (useful after mutations)
 * Defined before service object so it can be called from within service methods
 */
function invalidateProjectsCacheInternal(): void {
  getAllCache = null;
  getAllInProgress = null;
  console.log(`[projectsService] Cache invalidated`);
}

export const projectsService = {
  async getAll(options?: {
    includeArchived?: boolean;
  }): Promise<ProjectsListResponse> {
    const stackTrace = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
    const cacheKey = getAllCacheKey(options);
    
    console.log(`[projectsService.getAll] Called at ${new Date().toISOString()}`, {
      options,
      cacheKey,
      caller: stackTrace,
    });
    
    // Check cache
    if (getAllCache && getAllCache.key === cacheKey && getAllCache.at > Date.now() - GET_ALL_CACHE_MS) {
      console.log(`[projectsService.getAll] Returning cached data (age: ${Date.now() - getAllCache.at}ms)`);
      return getAllCache.data;
    }
    
    // If request is already in progress, return the same promise
    if (getAllInProgress) {
      console.log(`[projectsService.getAll] Request already in progress, reusing promise`);
      return getAllInProgress;
    }
    
    const params: Record<string, string> = {};
    if (options?.includeArchived) params.includeArchived = "true";
    console.log(`[projectsService.getAll] Making API request to /projects`);
    
    // Create the request promise and store it
    getAllInProgress = apiClient.get<ProjectsListResponse>("/projects", params)
      .then((result) => {
        getAllCache = { data: result, at: Date.now(), key: cacheKey };
        getAllInProgress = null;
        console.log(`[projectsService.getAll] API request completed, received ${result.projects?.length ?? 0} projects, cached`);
        return result;
      })
      .catch((err) => {
        getAllInProgress = null;
        throw err;
      });
    
    return getAllInProgress;
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
    const result = await apiClient.post<ProjectDetailResponse>("/projects", data);
    invalidateProjectsCacheInternal();
    return result;
  },

  async archive(projectId: string): Promise<{ success: true; message: string }> {
    const result = await apiClient.delete(`/projects/${projectId}`);
    invalidateProjectsCacheInternal();
    return result;
  },

  async restore(projectId: string): Promise<{ success: true; message: string }> {
    const result = await apiClient.post(`/projects/${projectId}/restore`);
    invalidateProjectsCacheInternal();
    return result;
  },

  async deletePermanently(
    projectId: string
  ): Promise<{ success: true; message: string }> {
    const result = await apiClient.delete(`/projects/${projectId}/permanent`);
    invalidateProjectsCacheInternal();
    return result;
  },

  async refresh(projectId: string): Promise<ProjectDetailResponse> {
    return apiClient.post<ProjectDetailResponse>(
      `/projects/${projectId}/refresh`,
    );
  },

  async expandStreets(projectId: string): Promise<{
    success: true;
    project: ProjectDetail;
    addedSegments: number;
    message: string;
  }> {
    return apiClient.post(`/projects/${projectId}/expand-streets`);
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

/**
 * Export cache invalidation function for external use
 */
export function invalidateProjectsCache(): void {
  invalidateProjectsCacheInternal();
}
