/**
 * Project Suggestions Service
 *
 * Fetches the "Next Run" payload scoped to a single project from
 * GET /projects/:id/next-runs. Independent from homepage.service.ts.
 */

import { apiClient } from "../lib/api-client";
import type { HomepageSuggestion } from "./homepage.service";

export type { HomepageSuggestion };

/** Coarse project lifecycle — drives which panel the UI renders. */
export type ProjectState = "preparing" | "in_progress" | "completed";

export interface ProjectCompletionSummary {
  completedAt: string | null;
  totalStreets: number;
  totalDistanceKm: number;
}

export interface ProjectSuggestionsPayload {
  primarySuggestion: HomepageSuggestion | null;
  alternates: HomepageSuggestion[];
  projectContext: {
    id: string;
    name: string;
    centerLat: number;
    centerLng: number;
    radiusMeters: number;
  };
  projectState: ProjectState;
  completionSummary?: ProjectCompletionSummary;
  totalActivities: number;
  totalDistanceKm: number;
  lastRun?: {
    activityId: string;
    date: string;
    distanceKm: number;
    newStreets: number;
    daysAgo: number;
    bbox?: [number, number, number, number];
  };
  recentRuns: Array<{
    activityId: string;
    name: string;
    date: string;
    distanceKm: number;
    bbox: [number, number, number, number];
  }>;
}

interface ProjectSuggestionsResponse {
  success: boolean;
  data: ProjectSuggestionsPayload;
}

const CACHE_MS = 60 * 1000;

const cache = new Map<string, { payload: ProjectSuggestionsPayload; at: number }>();

export async function getProjectSuggestions(
  projectId: string,
): Promise<ProjectSuggestionsPayload> {
  const hit = cache.get(projectId);
  if (hit && hit.at > Date.now() - CACHE_MS) {
    return hit.payload;
  }
  const res = await apiClient.get<ProjectSuggestionsResponse>(
    `/projects/${projectId}/next-runs`,
  );
  if (!res.success || !res.data) {
    throw new Error("Project suggestions request failed");
  }
  cache.set(projectId, { payload: res.data, at: Date.now() });
  return res.data;
}

export function invalidateProjectSuggestionsCache(projectId?: string): void {
  if (projectId) cache.delete(projectId);
  else cache.clear();
}
