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
// Route Types
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

export interface RouteListItem {
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

export interface RouteDetail extends RouteListItem {
  streets: SnapshotStreet[];
  snapshotDate: string;
  inProgressCount: number;
  notStartedCount: number;
  refreshNeeded: boolean;
  daysSinceRefresh: number;
  newStreetsDetected?: number;
}

export interface RoutePreview {
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

export interface CreateRouteRequest {
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: 500 | 1000 | 2000 | 5000 | 10000;
  deadline?: string;
  cacheKey?: string;
}

export interface RoutesListResponse {
  success: true;
  routes: RouteListItem[];
  total: number;
}

export interface RouteDetailResponse {
  success: true;
  route: RouteDetail;
  warning?: string;
}

export interface RoutePreviewResponse {
  success: true;
  preview: RoutePreview;
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
  routesAffected?: number;
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
  routeImpacts: Array<{
    routeId: string;
    routeName: string;
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
}

/** Single street for map rendering with geometry and stats */
export interface MapStreet {
  osmId: string;
  name: string;
  highwayType: string;
  lengthMeters: number;
  percentage: number;
  status: "completed" | "partial";
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
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
