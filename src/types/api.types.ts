/**
 * API Types
 * Single source of truth for backend API request/response shapes.
 * Mirrors backend docs/TYPES_REFERENCE.md.
 */

// ============================================
// Common Types
// ============================================

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ============================================
// Auth Types
// ============================================

export interface AuthUser {
  id: string;
  name: string;
  email?: string | null;
  stravaId?: string | null;
  garminId?: string | null;
  profilePic?: string | null;
}

export interface AuthSuccessResponse {
  success: true;
  message: string;
  user: AuthUser;
}

// ============================================
// Project Types
// ============================================

export interface SnapshotStreet {
  osmId: string;
  name: string;
  lengthMeters: number;
  highwayType: string;
  completed: boolean;
  percentage: number;
  lastRunDate: string | null;
  isNew?: boolean;
}

export interface ProjectListItem {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  progress: number;
  totalStreets: number;
  completedStreets: number;
  totalLengthMeters: number;
  deadline: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectListItem {
  streets: SnapshotStreet[];
  snapshotDate: string;
  inProgressCount: number;
  notStartedCount: number;
  refreshNeeded: boolean;
  daysSinceRefresh: number;
  newStreetsDetected?: number;
}

export interface ProjectPreview {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  cachedRadiusMeters: number;
  cacheKey: string;
  totalStreets: number;
  totalLengthMeters: number;
  streetsByType: Record<string, number>;
  warnings: string[];
}

export interface CreateProjectRequest {
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: 500 | 1000 | 2000 | 5000 | 10000;
  deadline?: string;
  cacheKey?: string;
}

export interface ProjectsListResponse {
  success: true;
  projects: ProjectListItem[];
  total: number;
}

export interface ProjectDetailResponse {
  success: true;
  project: ProjectDetail;
  warning?: string;
}

export interface ProjectPreviewResponse {
  success: true;
  preview: ProjectPreview;
}

/** Single street for project map (geometry + status for colouring) */
export interface ProjectMapStreet {
  osmId: string;
  name: string;
  highwayType: string;
  lengthMeters: number;
  percentage: number;
  status: "completed" | "partial" | "not_started";
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

/** Circle boundary for project map centering */
export interface ProjectMapBoundary {
  type: "circle";
  center: { lat: number; lng: number };
  radiusMeters: number;
}

/** Stats for project map view */
export interface ProjectMapStats {
  totalStreets: number;
  completedStreets: number;
  partialStreets: number;
  notRunStreets: number;
  completionPercentage: number;
}

export interface ProjectMapData {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  progress: number;
  boundary: ProjectMapBoundary;
  stats: ProjectMapStats;
  streets: ProjectMapStreet[];
  geometryCacheHit: boolean;
}

export interface ProjectMapResponse {
  success: true;
  map: ProjectMapData;
}

// ============================================
// Activity Types
// ============================================

export interface ActivityListItem {
  id: string;
  stravaId: string;
  name: string;
  distanceMeters: number;
  durationSeconds: number;
  startDate: string;
  activityType: string;
  isProcessed: boolean;
  createdAt: string;
  projectsAffected?: number;
  streetsCompleted?: number;
  streetsImproved?: number;
}

export interface ActivityImpact {
  completed: string[];
  improved: Array<{
    osmId: string;
    from: number;
    to: number;
  }>;
}

export interface GpxPoint {
  lat: number;
  lng: number;
  elevation?: number;
  timestamp?: string;
}

export interface ActivityDetail extends ActivityListItem {
  coordinates: GpxPoint[];
  processedAt: string | null;
  projectImpacts: Array<{
    projectId: string;
    projectName: string;
    streetsCompleted: number;
    streetsImproved: number;
    impactDetails: ActivityImpact | null;
  }>;
}

export interface ActivitiesListResponse {
  success: true;
  activities: ActivityListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ActivityDetailResponse {
  success: true;
  activity: ActivityDetail;
}

// ============================================
// GPX Analysis Types
// ============================================

export interface AggregatedStreet {
  name: string;
  normalizedName: string;
  highwayType: string;
  totalLengthMeters: number;
  totalDistanceCoveredMeters: number;
  totalDistanceRunMeters: number;
  coverageRatio: number;
  rawCoverageRatio: number;
  completionStatus: "FULL" | "PARTIAL";
  segmentCount: number;
  segmentOsmIds: string[];
}

export interface GpxAnalysisResponse {
  success: true;
  analysis: {
    gpxName?: string;
    totalDistanceMeters: number;
    durationSeconds: number | null;
    pointsCount: number;
    streetsTotal: number;
    streetsFullCount: number;
    streetsPartialCount: number;
    percentageFullStreets: number;
  };
  streets: {
    total: number;
    fullCount: number;
    partialCount: number;
    list: AggregatedStreet[];
  };
}

/** Raw response from POST /engine-v2/analyze (normalized to GpxAnalysisResponse by gpx.service when VITE_GPX_ENGINE=v2). */
export interface EngineV2AnalyzeResponse {
  success: boolean;
  run: {
    name: string | null;
    date: string;
    totalPoints: number;
    matchedPoints: number;
    matchConfidence: number;
    distanceMeters: number;
  };
  streets: Array<{
    name: string;
    wayIds: string[];
    edgesTotal: number;
    edgesCompleted: number;
    isComplete: boolean;
    completionPercent: number;
  }>;
}

// ============================================
// Map Types (Home page map view)
// Mirrors backend src/types/map.types.ts
// ============================================

/** Stats for a single street, shown in the map info icon popup */
export interface MapStreetStats {
  runCount: number;
  completionCount: number;
  firstRunDate: string | null;
  lastRunDate: string | null;
  totalLengthMeters: number;
  currentPercentage: number;
  everCompleted: boolean;
  /** Length-weighted completion ratio (0–1), connectors count at CONNECTOR_WEIGHT */
  weightedCompletionRatio: number;
  /** Number of OSM segments that make up this street */
  segmentCount: number;
  /** Number of segments classified as connectors (length <= CONNECTOR_MAX_LENGTH_METERS) */
  connectorCount: number;
}

/** Single street for map rendering with geometry and stats */
export interface MapStreet {
  osmId: string;
  name: string;
  highwayType: string;
  lengthMeters: number;
  percentage: number;
  status: "completed" | "partial";
  /** Full street geometry (GeoJSON LineString) */
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  /** Covered portion only (for partial streets; full street drawn in grey otherwise) */
  coveredGeometry?: {
    type: "LineString";
    coordinates: [number, number][];
  };
  /** Coverage interval [start%, end%] when partial */
  coverageInterval?: [number, number];
  stats: MapStreetStats;
}

/** Response for GET /api/v1/map/streets */
export interface MapStreetsResponse {
  success: true;
  /** Aggregated logical streets (for list) */
  streets: MapStreet[];
  /** Segment-level streets (for map polylines) */
  segments: MapStreet[];
  center: { lat: number; lng: number };
  radiusMeters: number;
  totalStreets: number;
  completedCount: number;
  partialCount: number;
}
