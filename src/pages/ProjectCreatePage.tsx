/**
 * ProjectCreatePage
 * Create a project: draw a polygon or circle on the map, auto-preview, name, create.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import type { LatLngTuple } from "leaflet";
import { MousePointer2, Hexagon, MapPin, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  Input,
  StreetListItem,
  InlineLoader,
  type StreetListItemData,
} from "../components/common";
import {
  UniversalSearchInput,
  ProjectCreatedModal,
} from "../components/projects";
import {
  UnifiedMap,
  MAP_ZOOM,
  MapFilterCard,
  ALL_BINS,
  type ShapeData,
} from "../components/map";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { useGeolocation, useGpsTraces, useMapStreets } from "../hooks";
import { isUnnamedStreet, type FilterStatus } from "../utils/street-filters";
import { normalizeStreetName } from "../utils/normalize-street-name";
import { ROUTES, DEFAULT_PROJECT_RADIUS_METERS } from "../config/constants";
import type { ProjectMapStreet } from "../types/api.types";
import { usePreferences, useFormatters } from "../contexts/PreferencesContext";
import { useToast } from "../contexts/ToastContext";
import type { ProjectPreview, BoundaryMode } from "../types/api.types";
import type { GeocodingResult } from "../types/api.types";

const DEFAULT_CENTER: LatLngTuple = [50.8, -1.09];
const AUTO_PREVIEW_DEBOUNCE_MS = 800;
/** Predefined radius snap points for better UX across large range */
const RADIUS_SNAP_POINTS = [
  100, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000,
  15000, 20000, 30000, 50000,
];

/** Snap a radius (m) to the nearest RADIUS_SNAP_POINTS value so the slider and state stay in sync. */
function snapToRadiusPoints(meters: number): number {
  const idx = RADIUS_SNAP_POINTS.findIndex((p) => p >= meters);
  if (idx <= 0) return RADIUS_SNAP_POINTS[0];
  const prev = RADIUS_SNAP_POINTS[idx - 1];
  const next = RADIUS_SNAP_POINTS[idx];
  return meters - prev <= next - meters ? prev : next;
}

/** Normalize osmId to always have "way/" prefix for consistent map highlighting */
function normalizeOsmId(osmId: string): string {
  return osmId.startsWith("way/") ? osmId : `way/${osmId}`;
}

/** Compute [minLat, minLng, maxLat, maxLng] from GeoJSON LineString coordinates [lng, lat][] */
function computeBboxFromCoords(
  coords: [number, number][],
): [number, number, number, number] {
  if (coords.length === 0) return [0, 0, 0, 0];
  let minLng = coords[0][0],
    maxLng = coords[0][0],
    minLat = coords[0][1],
    maxLat = coords[0][1];
  for (let i = 1; i < coords.length; i++) {
    const [lng, lat] = coords[i];
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLat, minLng, maxLat, maxLng];
}

/**
 * Pick the dominant highway type across a group of segments (weighted by length).
 * OSM sometimes tags variants of the same logical street differently (e.g. Albert
 * Road has some `secondary` segments and one `residential` spur); weighting by
 * length picks the label that best reflects how the street actually looks.
 */
function pickDominantHighwayType(
  segments: ReadonlyArray<{ highwayType?: string; totalLengthMeters: number }>,
): string | undefined {
  const byType = new Map<string, number>();
  for (const s of segments) {
    if (!s.highwayType) continue;
    byType.set(
      s.highwayType,
      (byType.get(s.highwayType) ?? 0) + s.totalLengthMeters,
    );
  }
  let best: string | undefined;
  let bestLen = -1;
  for (const [t, len] of byType) {
    if (len > bestLen) {
      best = t;
      bestLen = len;
    }
  }
  return best ?? segments[0]?.highwayType;
}

/** Lucide React icons for map tools */
const ToolIcons = {
  cursor: <MousePointer2 size={20} />,
  polygon: <Hexagon size={20} />,
  marker: <MapPin size={20} />,
  trash: <Trash2 size={20} />,
};

export function ProjectCreatePage() {
  const { position: geoPosition, requestPermission } = useGeolocation();
  const preferences = usePreferences();
  const { formatRadius, formatDistance } = useFormatters();
  const toast = useToast();

  /** Default radius from user preferences (meters), snapped to slider points. Used when placing/resetting marker. */
  const defaultRadiusMeters = useMemo(
    () =>
      snapToRadiusPoints(
        preferences?.preferences?.defaultProjectRadius ??
          DEFAULT_PROJECT_RADIUS_METERS,
      ),
    [preferences?.preferences?.defaultProjectRadius],
  );

  const [activeShape, setActiveShape] = useState<ShapeData | null>(null);
  const [activeTool, setActiveTool] = useState<"cursor" | "polygon" | "marker">(
    "cursor",
  );
  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [markerRadius, setMarkerRadius] = useState(
    DEFAULT_PROJECT_RADIUS_METERS,
  );
  const [highlightOsmIds, setHighlightOsmIds] = useState<string[]>([]);
  const [streetHighlightBbox, setStreetHighlightBbox] = useState<
    [number, number, number, number] | null
  >(null);

  // Auto-request geolocation on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);
  const [preview, setPreview] = useState<ProjectPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [includePartialStreets, setIncludePartialStreets] = useState(true);
  const [includePreviousRuns, setIncludePreviousRuns] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showStreetsList, setShowStreetsList] = useState(false);
  const [streetSearch, setStreetSearch] = useState("");
  const [successModal, setSuccessModal] = useState<{
    projectId: string;
    totalStreets: number;
    totalStreetNames: number;
    totalLengthMeters: number;
  } | null>(null);
  const previewAbortRef = useRef<AbortController | null>(null);

  const [showTraces, setShowTraces] = useState(false);
  const [visibleBins, setVisibleBins] = useState<Set<FilterStatus>>(
    () => new Set(ALL_BINS as FilterStatus[]),
  );
  const allBinsActive = visibleBins.size === ALL_BINS.length;

  const toggleBin = useCallback((bin: FilterStatus) => {
    setVisibleBins((prev) => {
      const next = new Set(prev);
      if (next.has(bin)) {
        next.delete(bin);
        if (next.size === 0) return new Set(ALL_BINS as FilterStatus[]);
        return next;
      }
      next.add(bin);
      return next;
    });
  }, []);

  const { data: mapStreetsData } = useMapStreets(
    geoPosition?.lat ?? null,
    geoPosition?.lng ?? null,
    1000,
  );
  const mapStreets = mapStreetsData?.segments ?? [];

  const previewMapStreets: ProjectMapStreet[] = useMemo(() => {
    if (!preview?.streets) return [];
    return preview.streets
      .filter((s) => s.geometry && s.osmId)
      .map((s) => ({
        osmId: s.osmId!,
        name: s.name,
        highwayType: s.highwayType,
        lengthMeters: s.totalLengthMeters,
        percentage: s.percentage ?? 0,
        status: (s.status ?? "not_started") as ProjectMapStreet["status"],
        geometry: s.geometry!,
        logicalStreetKey: s.logicalStreetKey,
      }));
  }, [preview?.streets]);

  const boundaryMode: BoundaryMode = includePartialStreets
    ? "intersects"
    : "strict";

  const markerBbox = useMemo((): [number, number, number, number] | null => {
    if (!markerPosition || !markerRadius) return null;
    const latDeg = markerRadius / 111320;
    const lngDeg =
      markerRadius / (111320 * Math.cos((markerPosition.lat * Math.PI) / 180));
    return [
      markerPosition.lat - latDeg,
      markerPosition.lng - lngDeg,
      markerPosition.lat + latDeg,
      markerPosition.lng + lngDeg,
    ];
  }, [markerPosition, markerRadius]);

  const mapCenter: LatLngTuple =
    activeShape?.type === "circle"
      ? [activeShape.center.lat, activeShape.center.lng]
      : activeShape?.type === "polygon"
        ? (() => {
            const c = activeShape.coordinates;
            if (c.length === 0) return DEFAULT_CENTER;
            const sum = c.reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]);
            return [sum[1] / c.length, sum[0] / c.length] as LatLngTuple;
          })()
        : geoPosition
          ? [geoPosition.lat, geoPosition.lng]
          : DEFAULT_CENTER;

  const hasValidShape = activeShape != null;

  const tracesRadius =
    activeShape?.type === "circle"
      ? activeShape.radiusMeters
      : activeShape?.type === "polygon"
        ? 5000
        : 1000;
  const tracesCenter: LatLngTuple | null = hasValidShape
    ? mapCenter
    : geoPosition
      ? [geoPosition.lat, geoPosition.lng]
      : null;
  const { traces: gpsTraces } = useGpsTraces({
    lat: tracesCenter?.[0] ?? null,
    lng: tracesCenter?.[1] ?? null,
    radius: tracesRadius,
  });

  const handleSearchSelect = useCallback(
    (result: GeocodingResult) => {
      const point = { lat: result.lat, lng: result.lng };
      setMarkerPosition(point);
      setActiveShape({
        type: "circle",
        center: point,
        radiusMeters: markerRadius,
      });
      setActiveTool("marker");
      setPreview(null);
      setPreviewError(null);
    },
    [markerRadius],
  );

  // Request ID to discard stale responses from race conditions
  const previewRequestIdRef = useRef(0);

  // Unified preview effect: debounced fetch with proper abort handling
  useEffect(() => {
    if (!activeShape) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }

    // Increment request ID to track this specific request
    const requestId = ++previewRequestIdRef.current;

    const t = setTimeout(() => {
      // Abort any previous in-flight request
      previewAbortRef.current?.abort();
      previewAbortRef.current = new AbortController();
      const signal = previewAbortRef.current.signal;

      setPreviewLoading(true);
      setPreviewError(null);

      const opts =
        activeShape.type === "circle"
          ? {
              boundaryType: "circle" as const,
              centerLat: activeShape.center.lat,
              centerLng: activeShape.center.lng,
              radiusMeters: activeShape.radiusMeters,
            }
          : {
              boundaryType: "polygon" as const,
              polygonCoordinates: activeShape.coordinates,
            };

      projectsService
        .preview(
          opts,
          boundaryMode,
          true, // Always include streets for preview (both circle and polygon)
          signal,
        )
        .then((res) => {
          // Only update state if this is still the latest request
          if (requestId === previewRequestIdRef.current) {
            setPreview(res.preview);
          }
        })
        .catch((err) => {
          // Ignore abort errors and stale responses
          if (signal.aborted || requestId !== previewRequestIdRef.current)
            return;
          setPreviewError(
            err instanceof ApiError ? err.message : "Failed to load preview",
          );
          setPreview(null);
        })
        .finally(() => {
          // Only update loading state if this is still the latest request
          if (requestId === previewRequestIdRef.current) {
            setPreviewLoading(false);
          }
        });
    }, AUTO_PREVIEW_DEBOUNCE_MS);

    return () => {
      clearTimeout(t);
      previewAbortRef.current?.abort();
    };
  }, [activeShape, boundaryMode]);

  const handleCreate = useCallback(async () => {
    if (!preview || !name.trim() || !activeShape) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      const body =
        activeShape.type === "circle"
          ? {
              name: name.trim(),
              boundaryType: "circle" as const,
              centerLat: activeShape.center.lat,
              centerLng: activeShape.center.lng,
              radiusMeters: activeShape.radiusMeters,
              boundaryMode,
              includePreviousRuns,
              cacheKey: preview.cacheKey,
            }
          : {
              name: name.trim(),
              boundaryType: "polygon" as const,
              polygonCoordinates: activeShape.coordinates,
              boundaryMode,
              includePreviousRuns,
              cacheKey: preview.cacheKey,
            };
      const res = await projectsService.create(body);
      const project = res?.project;
      if (project?.id != null) {
        const streetCount =
          project.totalStreetNames ?? project.totalStreets ?? 0;
        setSuccessModal({
          projectId: String(project.id),
          totalStreets: project.totalStreets ?? 0,
          totalStreetNames: streetCount,
          totalLengthMeters: project.totalLengthMeters ?? 0,
        });
      } else {
        const msg =
          "Project was created but the response was invalid. Check your projects list.";
        setCreateError(msg);
        toast?.showToast(msg, "warning");
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to create project";
      setCreateError(msg);
      toast?.showToast(msg, "error");
    } finally {
      setCreateLoading(false);
    }
  }, [preview, name, activeShape, boundaryMode, includePreviousRuns, toast]);

  const canCreate = Boolean(
    hasValidShape && preview?.cacheKey && name.trim() && !createLoading,
  );

  type PreviewStreet = NonNullable<ProjectPreview["streets"]>[number];

  // Backend emits one row per OSM segment (for clean per-way polyline rendering
  // on the map — avoids zigzag from merging parallel carriageways), but repeats
  // `logicalStreetKey` across rows that share a spatially-aware logical street.
  // For the list UI we collapse to one row per logical street so the user sees
  // "Albert Road" once, not 5×, and clicking highlights every segment at once.
  const { streetListItems, segmentsByListKey } = useMemo(() => {
    if (!preview?.streets) {
      return {
        streetListItems: [] as StreetListItemData[],
        segmentsByListKey: new Map<string, PreviewStreet[]>(),
      };
    }

    const groups = new Map<string, PreviewStreet[]>();
    for (const s of preview.streets) {
      if (!s.name || isUnnamedStreet(s.name)) continue;
      if (s.osmId == null) continue;
      const key = s.logicalStreetKey ?? normalizeStreetName(s.name);
      let bucket = groups.get(key);
      if (!bucket) {
        bucket = [];
        groups.set(key, bucket);
      }
      bucket.push(s);
    }

    const items: StreetListItemData[] = [];
    // Keyed by the first (normalized) OSM id of the group. One logical street
    // always has a stable, unique first osmId, so this avoids overloading
    // `osmIds` with a synthetic group key.
    const lookup = new Map<string, PreviewStreet[]>();
    for (const segments of groups.values()) {
      if (segments.length === 0) continue;
      const first = segments[0];
      const osmIds = segments.map((s) => String(s.osmId));
      items.push({
        name: first.name,
        osmIds,
        lengthKm: first.totalLengthMeters / 1000,
        highwayType: pickDominantHighwayType(segments),
        segmentCount: segments.length,
      });
      lookup.set(normalizeOsmId(osmIds[0]), segments);
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    return { streetListItems: items, segmentsByListKey: lookup };
  }, [preview?.streets]);

  const handleStreetHighlight = useCallback(
    (streetData: StreetListItemData) => {
      const firstId = streetData.osmIds[0];
      if (!firstId) return;
      const segments = segmentsByListKey.get(normalizeOsmId(firstId));
      if (!segments || segments.length === 0) return;

      const normalizedIds = segments
        .map((s) => (s.osmId != null ? normalizeOsmId(String(s.osmId)) : null))
        .filter((id): id is string => id != null);

      const allCoords: [number, number][] = [];
      for (const s of segments) {
        const coords = s.geometry?.coordinates;
        if (coords) allCoords.push(...coords);
      }

      setHighlightOsmIds(normalizedIds);
      setStreetHighlightBbox(
        allCoords.length ? computeBboxFromCoords(allCoords) : null,
      );
    },
    [segmentsByListKey],
  );

  const handleStreetClear = useCallback(() => {
    setHighlightOsmIds([]);
    setStreetHighlightBbox(null);
  }, []);

  const formPanel = (
    <div className="flex flex-col gap-4 p-4 pb-8 md:min-h-0 md:flex-1 md:overflow-y-auto md:p-6 md:pb-6">
      <Link
        to={ROUTES.PROJECTS_LIST}
        className="text-sm text-text-muted hover:underline"
      >
        Back to projects
      </Link>
      <h2 className="text-2xl font-bold text-text">New Run Project</h2>

      <div className="rounded-lg border border-border bg-surface/50 p-4">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-text-muted">
          Map tools
        </p>
        <div className="flex w-full justify-evenly gap-2">
          <button
            type="button"
            title="Pan / Select"
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition-all ${
              activeTool === "cursor"
                ? "border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30"
                : "border-border bg-surface text-text hover:border-primary/50 hover:bg-border/20"
            }`}
            onClick={() => setActiveTool("cursor")}
          >
            {ToolIcons.cursor}
          </button>
          <button
            type="button"
            title="Draw polygon area"
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition-all ${
              activeTool === "polygon"
                ? "border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30"
                : "border-border bg-surface text-text hover:border-primary/50 hover:bg-border/20"
            }`}
            onClick={() => {
              setActiveTool("polygon");
              if (activeShape?.type === "circle") {
                setActiveShape(null);
                setMarkerPosition(null);
              }
            }}
          >
            {ToolIcons.polygon}
          </button>
          <button
            type="button"
            title="Place marker pin"
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition-all ${
              activeTool === "marker"
                ? "border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30"
                : "border-border bg-surface text-text hover:border-primary/50 hover:bg-border/20"
            }`}
            onClick={() => setActiveTool("marker")}
          >
            {ToolIcons.marker}
          </button>
          <button
            type="button"
            title="Delete shape"
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition-all ${
              !activeShape && !markerPosition
                ? "cursor-not-allowed border-border bg-surface text-text opacity-50"
                : "border-danger bg-danger/10 text-danger hover:bg-danger hover:text-surface hover:shadow-md"
            }`}
            onClick={() => {
              setActiveShape(null);
              setMarkerPosition(null);
              setMarkerRadius(defaultRadiusMeters);
              setPreview(null);
              setHighlightOsmIds([]);
              setStreetHighlightBbox(null);
            }}
            disabled={!activeShape && !markerPosition}
          >
            {ToolIcons.trash}
          </button>
        </div>
      </div>

      {preview && previewMapStreets.length > 0 ? (
        <MapFilterCard
          streets={previewMapStreets}
          visibleBins={visibleBins}
          onToggleBin={toggleBin}
          onToggleAll={() =>
            allBinsActive
              ? setVisibleBins(new Set())
              : setVisibleBins(new Set(ALL_BINS as FilterStatus[]))
          }
          allBinsActive={allBinsActive}
          showTraces={showTraces}
          onToggleTraces={() => setShowTraces((v) => !v)}
        />
      ) : (
        <button
          type="button"
          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all ${
            showTraces
              ? "bg-violet-500/15 ring-1 ring-inset ring-violet-500/40 text-violet-600 dark:text-violet-400"
              : "border border-border bg-surface text-text-muted/60 hover:bg-border/20"
          }`}
          onClick={() => setShowTraces((v) => !v)}
        >
          <span
            className={`flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${showTraces ? "border-transparent bg-violet-500" : "border-neutral-300 dark:border-neutral-600"}`}
          >
            {showTraces && (
              <svg viewBox="0 0 16 16" className="size-3 text-white">
                <path
                  d="M3 8l3 3 7-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold leading-tight">
              Run traces
            </span>
            <span
              className={`block text-[11px] leading-tight ${showTraces ? "" : "text-text-muted/50"}`}
            >
              Show your Strava GPS lines on map
            </span>
          </span>
        </button>
      )}

      <div>
        <label
          htmlFor="geocode-search"
          className="mb-1 block text-sm font-medium text-text"
        >
          Where?
        </label>
        <UniversalSearchInput
          placeholder="Search anywhere: address, park, hospital…"
          onSelect={handleSearchSelect}
        />
      </div>

      {markerPosition && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-text">Radius</span>
            <span className="rounded bg-success/20 px-2 py-1 text-sm font-bold text-success">
              {formatRadius(markerRadius)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={RADIUS_SNAP_POINTS.length - 1}
            step={1}
            value={
              RADIUS_SNAP_POINTS.indexOf(markerRadius) !== -1
                ? RADIUS_SNAP_POINTS.indexOf(markerRadius)
                : RADIUS_SNAP_POINTS.findIndex((p) => p >= markerRadius) || 0
            }
            onChange={(e) => {
              const index = Number(e.target.value);
              const newRadius = RADIUS_SNAP_POINTS[index];
              setMarkerRadius(newRadius);
              if (markerPosition) {
                setActiveShape({
                  type: "circle",
                  center: markerPosition,
                  radiusMeters: newRadius,
                });
              }
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-border accent-success"
            aria-label="Project radius"
          />
          <div className="mt-1 flex justify-between text-xs text-text-muted">
            <span>{formatRadius(100)}</span>
            <span>{formatRadius(50000)}</span>
          </div>
        </div>
      )}

      {hasValidShape && (
        <Card padding="sm">
          {previewLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-3">
              <InlineLoader className="text-text-muted text-sm" />
              <p className="text-center text-xs leading-snug text-text-muted">
                Loading streets for this area. The first preview in a new city
                can take longer while we sync map data from OpenStreetMap.
              </p>
            </div>
          ) : previewError ? (
            <p className="text-danger text-sm">{previewError}</p>
          ) : preview ? (
            <>
              <p className="text-text">
                <strong>{preview.totalStreetNames}</strong> street
                {preview.totalStreetNames !== 1 ? "s" : ""} ·{" "}
                <strong>{formatDistance(preview.totalLengthMeters, 1)}</strong>{" "}
                total
              </p>
              {preview?.warnings && preview.warnings.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-text-muted text-sm">
                  {preview.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </>
          ) : null}
        </Card>
      )}

      {/* Collapsible street list */}
      {hasValidShape && preview && !previewLoading && (
        <details
          className="mb-4"
          open={showStreetsList}
          onToggle={(e) => {
            const isOpen = e.currentTarget.open;
            setShowStreetsList(isOpen);
            if (!isOpen) {
              setStreetSearch("");
            }
          }}
        >
          <summary className="flex min-h-[44px] cursor-pointer items-center rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Preview streets ({preview.totalStreetNames})
          </summary>
          {showStreetsList && (
            <>
              {streetListItems.length > 0 ? (
                <Card className="mt-2">
                  <div className="space-y-4">
                    <Input
                      type="search"
                      placeholder="Search by name…"
                      value={streetSearch}
                      onChange={(e) => setStreetSearch(e.target.value)}
                      aria-label="Search streets"
                    />
                    <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-border">
                      <ul className="list-none divide-y divide-border p-0">
                        {streetListItems
                          .filter((s) =>
                            streetSearch.trim()
                              ? s.name
                                  .toLowerCase()
                                  .includes(streetSearch.trim().toLowerCase())
                              : true,
                          )
                          .map((street, idx) => (
                            <StreetListItem
                              key={street.osmIds[0] ?? `${street.name}-${idx}`}
                              street={street}
                              onHighlight={handleStreetHighlight}
                              onClearHighlight={handleStreetClear}
                              variant="minimal"
                            />
                          ))}
                      </ul>
                      {streetListItems.filter((s) =>
                        streetSearch.trim()
                          ? s.name
                              .toLowerCase()
                              .includes(streetSearch.trim().toLowerCase())
                          : true,
                      ).length === 0 && (
                        <p className="p-4 text-center text-text-muted text-sm">
                          No streets match your search.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="mt-2">
                  <div className="flex items-center justify-center p-4">
                    <InlineLoader className="text-text-muted text-sm" />
                  </div>
                </Card>
              )}
            </>
          )}
        </details>
      )}

      <Input
        label="Project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Portsmouth South"
        required
        maxLength={100}
      />

      <label className="flex min-h-[44px] cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={includePartialStreets}
          onChange={(e) => setIncludePartialStreets(e.target.checked)}
          className="h-5 w-5 border-border text-primary focus:ring-primary"
        />
        <span className="text-text text-sm">
          Include streets that cross your area
          {preview && (
            <span className="ml-2 text-text-muted text-xs block mt-1">
              {includePartialStreets
                ? `✓ Intersects: Includes any street that touches your area (${preview.totalStreetNames} streets)`
                : `✗ Strict: Only streets fully within your area (${preview.totalStreetNames} streets)`}
            </span>
          )}
        </span>
      </label>

      <label className="flex min-h-[44px] cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={includePreviousRuns}
          onChange={(e) => setIncludePreviousRuns(e.target.checked)}
          className="h-5 w-5 border-border text-primary focus:ring-primary"
        />
        <span className="text-text text-sm">
          Include previous Strava runs
          <span className="ml-2 text-text-muted text-xs block mt-1">
            Count activities you&apos;ve already completed in this area toward
            your progress
          </span>
        </span>
      </label>

      {createError && <p className="text-danger text-sm">{createError}</p>}
      <Button
        type="button"
        onClick={handleCreate}
        disabled={!canCreate}
        className="min-h-[48px] w-full"
      >
        {createLoading
          ? "Creating…"
          : includePreviousRuns
            ? "Create project and calculate progress"
            : "Create project"}
      </Button>
    </div>
  );

  const handleMapClickForMarker = useCallback(
    (point: { lat: number; lng: number }) => {
      setMarkerPosition(point);
      setMarkerRadius(defaultRadiusMeters);
      setActiveShape({
        type: "circle",
        center: point,
        radiusMeters: defaultRadiusMeters,
      });
    },
    [defaultRadiusMeters],
  );

  const handleMarkerClick = useCallback(() => {
    setMarkerPosition(null);
    setActiveShape(null);
    setMarkerRadius(defaultRadiusMeters);
  }, [defaultRadiusMeters]);

  const handleMapClick = useCallback(
    (point: { lat: number; lng: number }) => {
      if (activeTool === "marker") {
        handleMapClickForMarker(point);
      }
    },
    [activeTool, handleMapClickForMarker],
  );

  const helperText =
    activeTool === "polygon"
      ? "Click to add points. Double-click to finish. ESC to cancel."
      : activeTool === "marker"
        ? markerPosition
          ? "Click elsewhere to move. Click marker to remove."
          : "Click on the map to place a marker."
        : activeShape
          ? "Click a shape to edit."
          : "Select a tool above to define your project boundary.";

  const showUserLocationMarker = geoPosition && !activeShape;

  // Use user location zoom when available, preference default, or fallback
  const prefDefaultZoom =
    preferences?.preferences?.defaultMapZoom ?? MAP_ZOOM.DEFAULT;
  const mapZoom =
    geoPosition && !activeShape
      ? MAP_ZOOM.USER_LOCATION
      : activeShape
        ? MAP_ZOOM.PROJECT_DETAIL
        : prefDefaultZoom;

  const mapSection = (
    <div className="relative h-[40vh] min-h-[240px] w-full md:h-full md:min-h-0">
      <UnifiedMap
        center={{ lat: mapCenter[0], lng: mapCenter[1] }}
        zoom={mapZoom}
        userLocation={geoPosition}
        showUserLocationMarker={!!showUserLocationMarker}
        streets={previewMapStreets.length > 0 ? previewMapStreets : mapStreets}
        gpsTraces={showTraces ? gpsTraces : []}
        highlightOsmIds={highlightOsmIds}
        visibleStreetBins={
          previewMapStreets.length > 0 ? visibleBins : undefined
        }
        onVisibleStreetBinsChange={
          previewMapStreets.length > 0 ? setVisibleBins : undefined
        }
        drawingEnabled
        activeShape={activeShape}
        onShapeChange={setActiveShape}
        activeTool={activeTool}
        onClick={activeTool === "marker" ? handleMapClick : undefined}
        markerPosition={markerPosition}
        onMarkerClick={handleMarkerClick}
        highlightFocus={
          streetHighlightBbox
            ? { bbox: streetHighlightBbox }
            : markerBbox
              ? { bbox: markerBbox }
              : null
        }
        showDrawnCircle={true}
        showLegend
        showLegendGuide={false}
        isLoading={false}
        helperText={helperText}
        className="h-full w-full"
      />
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Full-width layout so map and form card share the same width (no jump). */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Mobile: map on top. Desktop: map left, form right */}
        <div className="h-[45vh] w-full shrink-0 md:h-full md:min-h-0 md:flex-1 md:shrink">
          {mapSection}
        </div>
        <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto border-border bg-surface md:w-[380px] md:flex-none md:border-l">
          {formPanel}
        </aside>
      </div>
      {successModal && (
        <ProjectCreatedModal
          isOpen={true}
          onClose={() => setSuccessModal(null)}
          projectId={successModal.projectId}
          totalStreets={successModal.totalStreetNames}
          totalLengthMeters={successModal.totalLengthMeters}
        />
      )}
    </div>
  );
}
