/**
 * User preferences service
 * GET /preferences, PATCH /preferences
 */

import { apiClient } from "../lib/api-client";

export interface UserPreferences {
  id: string;
  userId: string;
  timezone: string;
  weekStartsOn: number;
  lastViewedLat: number | null;
  lastViewedLng: number | null;
  lastViewedRadius: number | null;
  distanceUnit: string;
  theme: string;
  dateFormat: string;
  mapStyle: string;
  defaultMapZoom: number;
  defaultProjectRadius: number;
  defaultStreetFilter: string;
  createdAt: string;
  updatedAt: string;
}

export type UpdatePreferencesInput = Partial<{
  timezone: string;
  weekStartsOn: number;
  lastViewedLat: number;
  lastViewedLng: number;
  lastViewedRadius: number;
  distanceUnit: string;
  theme: string;
  dateFormat: string;
  mapStyle: string;
  defaultMapZoom: number;
  defaultProjectRadius: number;
  defaultStreetFilter: string;
}>;

export async function getPreferences(): Promise<UserPreferences> {
  const res = await apiClient.get<{ success: boolean; preferences: UserPreferences }>("/preferences");
  if (!res.preferences) throw new Error("No preferences returned");
  return res.preferences;
}

export async function updatePreferences(data: UpdatePreferencesInput): Promise<UserPreferences> {
  const res = await apiClient.patch<{ success: boolean; preferences: UserPreferences }>("/preferences", data);
  if (!res.preferences) throw new Error("No preferences returned");
  return res.preferences;
}
