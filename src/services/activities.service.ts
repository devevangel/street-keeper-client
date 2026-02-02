/**
 * Activities Service
 * List and detail for activities. Uses API client for backend calls.
 */

import { apiClient } from "../lib/api-client";
import type {
  ActivitiesListResponse,
  ActivityDetailResponse,
} from "../types/api.types";

export const activitiesService = {
  async getAll(
    page = 1,
    pageSize = 20
  ): Promise<ActivitiesListResponse> {
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
};
