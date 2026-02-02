/**
 * GPX Service
 * Upload and analyze GPX files. Uses API client for backend calls.
 */

import { apiClient } from "../lib/api-client";
import type { GpxAnalysisResponse } from "../types/api.types";

export const gpxService = {
  async analyze(file: File): Promise<GpxAnalysisResponse> {
    const formData = new FormData();
    formData.append("gpx", file);
    return apiClient.postFormData<GpxAnalysisResponse>(
      "/runs/analyze-gpx",
      formData
    );
  },
};
