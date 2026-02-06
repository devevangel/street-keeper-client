/**
 * GPX Service
 * Upload and analyze GPX files. Uses API client for backend calls.
 *
 * When VITE_GPX_ENGINE=v2, calls POST /engine-v2/analyze (requires userId).
 * When VITE_GPX_ENGINE=v1 or unset, calls POST /runs/analyze-gpx.
 */

import { apiClient } from "../lib/api-client";
import { GPX_ENGINE } from "../config/constants";
import type {
  GpxAnalysisResponse,
  EngineV2AnalyzeResponse,
} from "../types/api.types";

function mapV2ToGpxAnalysisResponse(raw: EngineV2AnalyzeResponse): GpxAnalysisResponse {
  const streets = raw.streets;
  const fullCount = streets.filter((s) => s.isComplete).length;
  const partialCount = streets.length - fullCount;
  const percentageFullStreets =
    streets.length > 0 ? (fullCount / streets.length) * 100 : 0;

  return {
    success: true,
    analysis: {
      gpxName: raw.run.name ?? undefined,
      totalDistanceMeters: raw.run.distanceMeters,
      durationSeconds: null,
      pointsCount: raw.run.totalPoints,
      streetsTotal: streets.length,
      streetsFullCount: fullCount,
      streetsPartialCount: partialCount,
      percentageFullStreets: Math.round(percentageFullStreets * 100) / 100,
    },
    streets: {
      total: streets.length,
      fullCount: fullCount,
      partialCount: partialCount,
      list: streets.map((s) => ({
        name: s.name,
        normalizedName: s.name,
        highwayType: "road",
        totalLengthMeters: s.edgesTotal,
        totalDistanceCoveredMeters: s.edgesCompleted,
        totalDistanceRunMeters: s.edgesCompleted,
        coverageRatio: s.completionPercent / 100,
        rawCoverageRatio: s.completionPercent / 100,
        completionStatus: (s.isComplete ? "FULL" : "PARTIAL") as "FULL" | "PARTIAL",
        segmentCount: s.wayIds.length,
        segmentOsmIds: s.wayIds,
      })),
    },
  };
}

export const gpxService = {
  /**
   * Analyze a GPX file. When VITE_GPX_ENGINE=v2, userId is required (e.g. from useAuth().user?.id).
   */
  async analyze(
    file: File,
    userId?: string
  ): Promise<GpxAnalysisResponse> {
    if (GPX_ENGINE === "v2") {
      if (!userId) {
        throw new Error(
          "userId is required when using the v2 GPX engine. Pass the current user id (e.g. from useAuth().user?.id)."
        );
      }
      const formData = new FormData();
      formData.append("gpxFile", file);
      const url = `/engine-v2/analyze?userId=${encodeURIComponent(userId)}`;
      const raw = await apiClient.postFormData<EngineV2AnalyzeResponse>(
        url,
        formData
      );
      return mapV2ToGpxAnalysisResponse(raw);
    }

    const formData = new FormData();
    formData.append("gpx", file);
    return apiClient.postFormData<GpxAnalysisResponse>(
      "/runs/analyze-gpx",
      formData
    );
  },
};
