/**
 * Auth Service
 * Strava OAuth and current user. Uses API client for backend calls.
 */

import { API } from "../config/constants";
import { apiClient } from "../lib/api-client";
import type { AuthSuccessResponse } from "../types/api.types";

const USER_STORAGE_KEY = "street-keeper-user";
const DEV_USER_STORAGE_KEY = "street-keeper-dev-user";

export const authService = {
  getStravaAuthUrl(): string {
    return `${API.BASE_URL}/auth/strava`;
  },

  loginWithStrava(): void {
    window.location.href = this.getStravaAuthUrl();
  },

  async getCallbackResponse(code: string): Promise<AuthSuccessResponse> {
    return apiClient.get<AuthSuccessResponse>("/auth/strava/callback", {
      code,
    });
  },

  async getCurrentUser(): Promise<AuthSuccessResponse> {
    return apiClient.get<AuthSuccessResponse>("/auth/me");
  },

  setAuthToken(token: string | null): void {
    apiClient.setAuthToken(token);
  },

  logout(): void {
    apiClient.setAuthToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  },

  /** Development only: bypass OAuth with a user ID */
  setDevUserId(userId: string | null): void {
    apiClient.setDevUserId(userId);
    if (userId) {
      localStorage.setItem(DEV_USER_STORAGE_KEY, userId);
    } else {
      localStorage.removeItem(DEV_USER_STORAGE_KEY);
    }
  },

  /** Restore dev user ID from localStorage (call on app init) */
  restoreDevUser(): string | null {
    const userId = localStorage.getItem(DEV_USER_STORAGE_KEY);
    if (userId) {
      apiClient.setDevUserId(userId);
    }
    return userId;
  },
};
