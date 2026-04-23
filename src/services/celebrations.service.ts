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

export type CelebrationMapBucket = "completed" | "started" | "improved";

export interface CelebrationMapStreetSegment {
  osmId: string;
  bucket: CelebrationMapBucket;
  path: [number, number][];
}

export interface CelebrationMapRunPath {
  activityId: string;
  path: [number, number][];
}

export interface CelebrationMapData {
  success: true;
  runs: CelebrationMapRunPath[];
  streets: CelebrationMapStreetSegment[];
  bbox: { south: number; west: number; north: number; east: number };
}

export interface CelebrationHistoryEntryDto {
  groupKey: string;
  activityId: string;
  activityStartDate: string;
  activityDistanceMeters: number;
  activityDurationSeconds: number;
  createdAt: string;
  acknowledged: boolean;
  sharedToStrava: boolean;
  rollup: {
    totalCompleted: number;
    totalStarted: number;
    totalImproved: number;
    projectCount: number;
  };
  events: PendingCelebrationEventDto[];
}

export interface CelebrationHistoryPage {
  success: boolean;
  entries: CelebrationHistoryEntryDto[];
  nextCursor: string | null;
}

export const celebrationsService = {
  async getPending(): Promise<PendingCelebrationBatch> {
    return apiClient.get<PendingCelebrationBatch>("/celebrations/pending");
  },

  async getHistory(opts: {
    cursor?: string | null;
    limit?: number;
    projectId?: string | null;
  } = {}): Promise<CelebrationHistoryPage> {
    const query: Record<string, string> = {};
    if (opts.cursor) query.cursor = opts.cursor;
    if (opts.limit != null) query.limit = String(opts.limit);
    if (opts.projectId) query.projectId = opts.projectId;
    return apiClient.get<CelebrationHistoryPage>("/celebrations/history", query);
  },

  async getMapData(eventIds: string[]): Promise<CelebrationMapData> {
    const q = eventIds.map(encodeURIComponent).join(",");
    return apiClient.get<CelebrationMapData>("/celebrations/map-data", {
      eventIds: q,
    });
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
