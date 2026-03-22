/**
 * Homepage API – single aggregated payload
 */
import { apiClient } from "../lib/api-client";
import type { MapStreet } from "../types/api.types";

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
  /** Inlined street segments for the map (same as GET /map/streets segments). Omitted when no real location. */
  mapSegments?: MapStreet[];
  /** Last run summary – always set when user has any processed activity. */
  lastRun?: {
    date: string;
    distanceKm: number;
    newStreets: number;
    daysAgo: number;
  };
  recentHighlights?: { newStreets: number; distanceKm: number };
  /** Whether this is a new user (no activities yet) */
  isNewUser: boolean;
  /** User's display name for personalization */
  userName?: string;
  /** First street suggestion for new users (nearest shortest street) */
  firstStreet?: {
    osmId: string;
    name: string;
    lengthMeters: number;
    distanceFromUser: number;
    geometry: Array<{ lat: number; lng: number }>;
    bbox: [number, number, number, number];
  };
  /** User-level stats for sidebar (favorites, exploration style, totals) */
  userStats?: {
    totalActivities: number;
    totalDistanceKm: number;
    accountCreatedAt: string;
    favoriteStreets: Array<{ name: string; runCount: number }>;
    explorationStyle: "trailblazer" | "balanced" | "habitual";
    newVsRevisitRatio: number;
  };
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

let cached: { payload: HomepagePayload; at: number; key: string } | null = null;

export async function getHomepageData(params: {
  lat?: number;
  lng?: number;
  radius?: number;
  projectId?: string;
  userLat?: number;
  userLng?: number;
}): Promise<HomepagePayload> {
  const q = new URLSearchParams();
  if (params.lat != null) q.set("lat", String(params.lat));
  if (params.lng != null) q.set("lng", String(params.lng));
  if (params.radius != null) q.set("radius", String(params.radius));
  if (params.projectId != null) q.set("projectId", params.projectId);
  if (params.userLat != null) q.set("userLat", String(params.userLat));
  if (params.userLng != null) q.set("userLng", String(params.userLng));
  const query = q.toString();
  const cacheKey = query || "default";
  
  if (import.meta.env.DEV) {
    const stackTrace = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
    console.log(`[getHomepageData] Called at ${new Date().toISOString()}`, {
      params: { ...params },
      cacheKey,
      fromCache: cached && cached.key === cacheKey && cached.at > Date.now() - CACHE_MS,
      caller: stackTrace,
    });
  }

  if (cached && cached.key === cacheKey && cached.at > Date.now() - CACHE_MS) {
    if (import.meta.env.DEV) console.log(`[getHomepageData] Returning cached data (age: ${Date.now() - cached.at}ms)`);
    return cached.payload;
  }
  const url = query ? `/homepage?${query}` : "/homepage";
  if (import.meta.env.DEV) console.log(`[getHomepageData] Making API request to: ${url}`);
  const res = await apiClient.get<HomepageResponse>(url);
  if (!res.success || !res.data) throw new Error("Homepage request failed");
  cached = { payload: res.data, at: Date.now(), key: cacheKey };
  if (import.meta.env.DEV) console.log(`[getHomepageData] API request completed, cached with key: ${cacheKey}`);
  return res.data;
}

export function invalidateHomepageCache(): void {
  cached = null;
}
