/**
 * Activities Service
 * List and detail for activities. Uses API client for backend calls.
 */

import { apiClient } from "../lib/api-client";
import type {
  ActivitiesListResponse,
  ActivityDetailResponse,
} from "../types/api.types";

export interface SyncFromStravaResponse {
  success: boolean;
  synced: number;
  processed: number;
  skipped: number;
  errors: Array<{ stravaId: string; reason: string }>;
}

export const activitiesService = {
  async getAll(page = 1, pageSize = 20): Promise<ActivitiesListResponse> {
    return apiClient.get<ActivitiesListResponse>("/activities", {
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
  },

  async getById(activityId: string): Promise<ActivityDetailResponse> {
    return apiClient.get<ActivityDetailResponse>(`/activities/${activityId}`);
  },

  async delete(
    activityId: string
  ): Promise<{ success: true; message: string }> {
    return apiClient.delete(`/activities/${activityId}`);
  },

  /**
   * Sync recent activities from Strava (POST /activities/sync).
   * Fetches activities from Strava and imports/processes them for the map.
   */
  async syncFromStrava(options?: {
    after?: number;
    before?: number;
    perPage?: number;
  }): Promise<SyncFromStravaResponse> {
    const params = new URLSearchParams();
    if (options?.after != null) params.set("after", String(options.after));
    if (options?.before != null) params.set("before", String(options.before));
    if (options?.perPage != null)
      params.set("perPage", String(options.perPage));
    const query = params.toString();
    const endpoint = query ? `/activities/sync?${query}` : "/activities/sync";
    return apiClient.post<SyncFromStravaResponse>(endpoint);
  },
};
