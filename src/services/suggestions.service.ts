/**
 * Suggestions Service
 * Fetches next-run suggestions for a project (almost complete, nearest, milestone, clusters).
 */

import { apiClient } from "../lib/api-client";
import type { SuggestionsResponse } from "../types/api.types";

export const suggestionsService = {
  async getSuggestions(
    projectId: string,
    options?: { lat?: number; lng?: number; maxResults?: number }
  ): Promise<SuggestionsResponse["suggestions"]> {
    const params: Record<string, string> = {};
    if (options?.lat != null) params.lat = String(options.lat);
    if (options?.lng != null) params.lng = String(options.lng);
    if (options?.maxResults != null)
      params.maxResults = String(options.maxResults);

    const res = await apiClient.get<SuggestionsResponse>(
      `/projects/${projectId}/suggestions`,
      Object.keys(params).length > 0 ? params : undefined
    );
    return res.suggestions;
  },
};
