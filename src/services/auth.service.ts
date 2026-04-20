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
    // Clear auth token
    apiClient.setAuthToken(null);
    
    // Clear user data
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(DEV_USER_STORAGE_KEY);
    
    // Clear onboarding completion so user sees onboarding again on next login
    localStorage.removeItem("onboarding_completed");
    
    // Clear all project welcome banner dismissals
    const projectWelcomePrefix = "project-welcome-";
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(projectWelcomePrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    
    // Clear dev user ID from API client
    apiClient.setDevUserId(null);
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
