/**
 * Homepage API – single aggregated payload
 */
import { apiClient } from "../lib/api-client";

export interface HomepagePayload {
  hero: { message: string; stateKey: string };
  streak: {
    currentWeeks: number;
    isAtRisk: boolean;
    lastRunDate: string | null;
    longestStreak: number;
    qualifyingRunsThisWeek: number;
  };
  primarySuggestion: HomepageSuggestion | null;
  alternates: HomepageSuggestion[];
  nextMilestone: {
    id: string;
    name: string;
    typeSlug: string;
    kind: string;
    isPinned: boolean;
    progress: {
      currentValue: number;
      targetValue: number;
      unit: string;
      ratio: number;
      isCompleted: boolean;
    };
    projectId?: string | null;
  } | null;
  mapContext: {
    lat: number;
    lng: number;
    radius: number;
    projectId?: string;
  };
  /** Last run summary – always set when user has any processed activity. */
  lastRun?: {
    date: string;
    distanceKm: number;
    newStreets: number;
    daysAgo: number;
  };
  recentHighlights?: { newStreets: number; distanceKm: number };
}

export interface HomepageSuggestion {
  type: string;
  title: string;
  shortCopy: string;
  cooldownKey: string;
  reason: string;
  focus: {
    bbox: [number, number, number, number];
    streetIds?: number[];
    startPoint?: { lat: number; lng: number };
  };
}

interface HomepageResponse {
  success: boolean;
  data: HomepagePayload;
}

const CACHE_MS = 60 * 1000;

let cached: { payload: HomepagePayload; at: number } | null = null;

export async function getHomepageData(params: {
  lat?: number;
  lng?: number;
  radius?: number;
  projectId?: string;
}): Promise<HomepagePayload> {
  const q = new URLSearchParams();
  if (params.lat != null) q.set("lat", String(params.lat));
  if (params.lng != null) q.set("lng", String(params.lng));
  if (params.radius != null) q.set("radius", String(params.radius));
  if (params.projectId != null) q.set("projectId", params.projectId);
  const query = q.toString();
  const cacheKey = query || "default";
  if (cached && (query ? cached.at > Date.now() - CACHE_MS : false)) {
    return cached.payload;
  }
  const url = query ? `/homepage?${query}` : "/homepage";
  const res = await apiClient.get<HomepageResponse>(url);
  if (!res.success || !res.data) throw new Error("Homepage request failed");
  cached = { payload: res.data, at: Date.now() };
  return res.data;
}

export function invalidateHomepageCache(): void {
  cached = null;
}
