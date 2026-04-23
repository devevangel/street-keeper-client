/**
 * Run celebrations API — GET pending, acknowledge, share to Strava.
 */

import { apiClient } from "../lib/api-client";

export interface PendingCelebrationEventDto {
  id: string;
  activityId: string;
  projectId: string | null;
  projectName: string | null;
  completedCount: number;
  startedCount: number;
  improvedCount: number;
  completedStreetNames: string[];
  startedStreetNames: string[];
  improvedStreetNames: string[];
  projectProgressBefore: number;
  projectProgressAfter: number;
  projectCompleted: boolean;
  activityDistanceMeters: number;
  activityDurationSeconds: number;
  activityStartDate: string;
  shareMessage: string | null;
  createdAt: string;
}

export interface PendingCelebrationRollup {
  totalCompleted: number;
  totalStarted: number;
  totalImproved: number;
  activityCount: number;
  projectCount: number;
}

export interface PendingCelebrationBatch {
  success: boolean;
  hasPending: boolean;
  events: PendingCelebrationEventDto[];
  rollup: PendingCelebrationRollup;
}

export const celebrationsService = {
  async getPending(): Promise<PendingCelebrationBatch> {
    return apiClient.get<PendingCelebrationBatch>("/celebrations/pending");
  },

  async acknowledge(eventIds?: string[]): Promise<{ success: boolean; updated: number }> {
    return apiClient.post<{ success: boolean; updated: number }>(
      "/celebrations/acknowledge",
      eventIds?.length ? { eventIds } : {},
    );
  },

  async shareToStrava(
    eventIds: string[],
  ): Promise<{ success: boolean; activitiesUpdated: number; eventsMarked: number }> {
    return apiClient.post<{ success: boolean; activitiesUpdated: number; eventsMarked: number }>(
      "/celebrations/share-to-strava",
      { eventIds },
    );
  },
};
