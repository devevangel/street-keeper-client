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

export interface SyncStatusResponse {
  syncId: string | null;
  status: "idle" | "queued" | "running" | "completed" | "failed";
  type: string | null;
  total: number;
  processed: number;
  skipped: number;
  errors: number;
  lastErrorMessage: string | null;
  updatedAt: string | null;
  lastCompletedAt?: string | null;
  latestStoredActivityStartDate?: string | null;
  latestStoredActivityName?: string | null;
}

export interface StartBackgroundSyncResponse {
  success: boolean;
  syncId: string;
  total: number;
  status: string;
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
    background?: boolean;
    /** Skip server cooldown (e.g. after OAuth or manual retry). */
    bypassCooldown?: boolean;
  }): Promise<SyncFromStravaResponse | StartBackgroundSyncResponse> {
    const params = new URLSearchParams();
    if (options?.after != null) params.set("after", String(options.after));
    if (options?.before != null) params.set("before", String(options.before));
    if (options?.perPage != null)
      params.set("perPage", String(options.perPage));
    if (options?.background === true) params.set("background", "true");
    if (options?.bypassCooldown === true) params.set("bypassCooldown", "true");
    const query = params.toString();
    const endpoint = query ? `/activities/sync?${query}` : "/activities/sync";
    return apiClient.post<SyncFromStravaResponse | StartBackgroundSyncResponse>(
      endpoint
    );
  },

  /**
   * Get current background sync status (GET /activities/sync/status).
   * Used for polling (header widget and homepage refresh hooks).
   */
  async getSyncStatus(): Promise<SyncStatusResponse> {
    return apiClient.get<SyncStatusResponse>("/activities/sync/status");
  },

  /** True when Strava has a newer activity than our latest stored run (GET /activities/sync/gap-check). */
  async getSyncGapCheck(): Promise<{ needsBackgroundSync: boolean }> {
    return apiClient.get<{ needsBackgroundSync: boolean }>(
      "/activities/sync/gap-check"
    );
  },
};
