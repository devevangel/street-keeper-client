/**
 * ProjectCreatePage
 * Create a project: draw a polygon or circle on the map, auto-preview, name, create.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import type { LatLngTuple } from "leaflet";
import { MousePointer2, Hexagon, MapPin, Trash2 } from "lucide-react";
import { Button, Card, Input, StreetListItem, type StreetListItemData } from "../components/common";
import {
  UniversalSearchInput,
  ProjectCreatedModal,
} from "../components/projects";
import { UnifiedMap, MAP_ZOOM, type ShapeData } from "../components/map";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { useGeolocation } from "../hooks";
import { ROUTES } from "../config/constants";
import type { ProjectPreview, ProjectMapStreet } from "../types/api.types";
import type { GeocodingResult } from "../types/api.types";

const DEFAULT_CENTER: LatLngTuple = [50.8, -1.09];
const DEFAULT_RADIUS_METERS = 300;
const AUTO_PREVIEW_DEBOUNCE_MS = 800;

/** Predefined radius snap points for better UX across large range */
const RADIUS_SNAP_POINTS = [
  100, 200, 300, 400, 500, 750,
  1000, 1500, 2000, 3000, 5000,
  7500, 10000, 15000, 20000, 30000, 50000,
];

/** Find nearest snap point for a given value */
function snapToNearest(value: number): number {
  let closest = RADIUS_SNAP_POINTS[0];
  let minDiff = Math.abs(value - closest);
  for (const point of RADIUS_SNAP_POINTS) {
    const diff = Math.abs(value - point);
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }
  return closest;
}

/** Format radius for display */
function formatRadius(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
  }
  return `${meters} m`;
}

/** Normalize osmId to always have "way/" prefix for consistent map highlighting */
function normalizeOsmId(osmId: string): string {
  return osmId.startsWith("way/") ? osmId : `way/${osmId}`;
}

/** Convert preview street (with geometry) to ProjectMapStreet for rendering on map */
function previewStreetToMapStreet(
  street: NonNullable<ProjectPreview["streets"]>[number]
): ProjectMapStreet | null {
  if (street.osmId == null || !street.geometry) return null;
  return {
    osmId: normalizeOsmId(String(street.osmId)),
    name: street.name,
    highwayType: street.highwayType,
    lengthMeters: street.totalLengthMeters,
    percentage: 0,
    status: "not_started",
    geometry: street.geometry,
  };
}

/** Compute [minLat, minLng, maxLat, maxLng] from GeoJSON LineString coordinates [lng, lat][] */
function computeBboxFromCoords(
  coords: [number, number][],
): [number, number, number, number] {
  if (coords.length === 0)
    return [0, 0, 0, 0];
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

/** Lucide React icons for map tools */
const ToolIcons = {
  cursor: <MousePointer2 size={20} />,
  polygon: <Hexagon size={20} />,
  marker: <MapPin size={20} />,
  trash: <Trash2 size={20} />,
};

export function ProjectCreatePage() {
  const {
    position: geoPosition,
    requestPermission,
    isLoading: geoLoading,
  } = useGeolocation();

  const [activeShape, setActiveShape] = useState<ShapeData | null>(null);
  const [activeTool, setActiveTool] = useState<
    "cursor" | "polygon" | "marker"
  >("cursor");
  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [markerRadius, setMarkerRadius] = useState(DEFAULT_RADIUS_METERS);
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

  const boundaryMode = includePartialStreets ? "centroid" : "strict";

  const markerBbox = useMemo((): [number, number, number, number] | null => {
    if (!markerPosition || !markerRadius) return null;
    const latDeg =
      markerRadius / 111320;
    const lngDeg =
      markerRadius /
      (111320 * Math.cos((markerPosition.lat * Math.PI) / 180));
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
          activeShape.type === "circle",
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
          if (signal.aborted || requestId !== previewRequestIdRef.current) return;
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
              cacheKey: preview.cacheKey,
            }
          : {
              name: name.trim(),
              boundaryType: "polygon" as const,
              polygonCoordinates: activeShape.coordinates,
              boundaryMode,
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
        setCreateError(
          "Project was created but the response was invalid. Check your projects list.",
        );
      }
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? err.message : "Failed to create project",
      );
    } finally {
      setCreateLoading(false);
    }
  }, [preview, name, activeShape, boundaryMode]);

  const canCreate = Boolean(
    hasValidShape && preview?.cacheKey && name.trim() && !createLoading,
  );

  type PreviewStreet = NonNullable<ProjectPreview["streets"]>[number];

  // Convert preview streets to StreetListItemData with geometry lookup (key as string for number/string osmId)
  const { streetListItems, streetGeometryLookup } = useMemo(() => {
    if (!preview?.streets) return { streetListItems: [], streetGeometryLookup: new Map<string, PreviewStreet>() };
    const items: StreetListItemData[] = [];
    const lookup = new Map<string, PreviewStreet>();
    for (const street of preview.streets) {
      const key = String(street.osmId ?? street.name);
      lookup.set(key, street);
      items.push({
        name: street.name,
        osmIds: street.osmId != null ? [String(street.osmId)] : [],
        lengthKm: street.totalLengthMeters / 1000,
        highwayType: street.highwayType,
        segmentCount: street.segmentCount,
      });
    }
    return { streetListItems: items, streetGeometryLookup: lookup };
  }, [preview?.streets]);

  const handleStreetHighlight = useCallback((streetData: StreetListItemData) => {
    const osmId = streetData.osmIds[0];
    const key = osmId != null ? String(osmId) : streetData.name;
    const street = streetGeometryLookup.get(key);
    if (!street?.geometry) return;
    const coords = street.geometry.coordinates;
    const bbox = computeBboxFromCoords(coords);
    const normalizedId = street.osmId != null ? normalizeOsmId(String(street.osmId)) : null;
    setHighlightOsmIds(normalizedId ? [normalizedId] : []);
    setStreetHighlightBbox(bbox);
  }, [streetGeometryLookup]);

  const handleStreetClear = useCallback(() => {
    setHighlightOsmIds([]);
    setStreetHighlightBbox(null);
  }, []);

  const formPanel = (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Link
        to={ROUTES.PROJECTS_LIST}
        className="text-sm text-text-muted hover:underline"
      >
        Back to projects
      </Link>
      <h2 className="text-2xl font-bold text-text">Create project</h2>

      <div className="rounded border-2 border-border bg-surface/50 p-2">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
          Map tools
        </p>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            title="Pan / Select"
            className={`flex h-9 w-9 items-center justify-center rounded border-2 transition-colors ${
              activeTool === "cursor"
                ? "border-accent bg-accent text-surface"
                : "border-border bg-surface text-text hover:border-accent/50 hover:bg-border/20"
            }`}
            onClick={() => setActiveTool("cursor")}
          >
            {ToolIcons.cursor}
          </button>
          <button
            type="button"
            title="Draw polygon area"
            className={`flex h-9 w-9 items-center justify-center rounded border-2 transition-colors ${
              activeTool === "polygon"
                ? "border-accent bg-accent text-surface"
                : "border-border bg-surface text-text hover:border-accent/50 hover:bg-border/20"
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
            className={`flex h-9 w-9 items-center justify-center rounded border-2 transition-colors ${
              activeTool === "marker"
                ? "border-accent bg-accent text-surface"
                : "border-border bg-surface text-text hover:border-accent/50 hover:bg-border/20"
            }`}
            onClick={() => setActiveTool("marker")}
          >
            {ToolIcons.marker}
          </button>
          <button
            type="button"
            title="Delete shape"
            className={`flex h-9 w-9 items-center justify-center rounded border-2 transition-colors ${
              !activeShape && !markerPosition
                ? "cursor-not-allowed border-border bg-surface text-text opacity-50"
                : "border-border bg-surface text-text hover:bg-border/20"
            }`}
            onClick={() => {
              setActiveShape(null);
              setMarkerPosition(null);
              setMarkerRadius(DEFAULT_RADIUS_METERS);
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
            value={RADIUS_SNAP_POINTS.indexOf(markerRadius) !== -1 
              ? RADIUS_SNAP_POINTS.indexOf(markerRadius) 
              : RADIUS_SNAP_POINTS.findIndex(p => p >= markerRadius) || 0}
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
            <span>100 m</span>
            <span>50 km</span>
          </div>
        </div>
      )}

      {hasValidShape && (
        <Card padding="sm">
          {previewLoading ? (
            <p className="text-text-muted text-sm">Loading preview…</p>
          ) : previewError ? (
            <p className="text-danger text-sm">{previewError}</p>
          ) : preview ? (
            <>
              <p className="text-text">
                <strong>{preview.totalStreetNames}</strong> street
                {preview.totalStreetNames !== 1 ? "s" : ""}
                {preview.totalStreets !== preview.totalStreetNames
                  ? ` (${preview.totalStreets} segments)`
                  : ""}{" "}
                ·{" "}
                <strong>{(preview.totalLengthMeters / 1000).toFixed(1)}</strong>{" "}
                km total
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
              setStreetSearch(""); // Clear search when closing
            }
          }}
        >
          <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted min-h-[44px] flex items-center">
            Preview streets ({preview.totalStreetNames})
          </summary>
          {showStreetsList && (
            <>
              {streetListItems.length > 0 ? (
                <Card className="mt-1">
                  <div className="space-y-3">
                    <input
                      type="search"
                      placeholder="Search by name…"
                      value={streetSearch}
                      onChange={(e) => setStreetSearch(e.target.value)}
                      className="w-full rounded border-2 border-border bg-surface px-3 py-2 text-text placeholder:text-text-muted focus:outline-none focus:ring-0 focus:ring-offset-0"
                      aria-label="Search streets"
                    />
                    <div className="max-h-[40vh] overflow-y-auto rounded border-2 border-border">
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
                <Card className="mt-1">
                  <p className="text-text-muted text-sm p-4">
                    Loading street list…
                  </p>
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
                ? `✓ Centroid mode: Includes streets whose center point is in your radius (${preview.totalStreetNames} streets)`
                : `✗ Strict mode: Only streets fully within radius (${preview.totalStreetNames} streets)`}
            </span>
          )}
        </span>
      </label>

      {createError && <p className="text-danger text-sm">{createError}</p>}
      <Button
        type="button"
        onClick={handleCreate}
        disabled={!canCreate}
        className="min-h-[48px] w-full"
      >
        {createLoading ? "Creating…" : "Create project"}
      </Button>
    </div>
  );

  const handleMapClickForMarker = useCallback(
    (point: { lat: number; lng: number }) => {
      setMarkerPosition(point);
      setMarkerRadius(DEFAULT_RADIUS_METERS);
      setActiveShape({
        type: "circle",
        center: point,
        radiusMeters: DEFAULT_RADIUS_METERS,
      });
    },
    [],
  );

  const handleMarkerClick = useCallback(() => {
    setMarkerPosition(null);
    setActiveShape(null);
    setMarkerRadius(DEFAULT_RADIUS_METERS);
  }, []);

  const handleMapClick = useCallback(
    (point: { lat: number; lng: number }) => {
      if (activeTool === "marker") {
        handleMapClickForMarker(point);
      }
    },
    [activeTool, handleMapClickForMarker],
  );

  // Convert preview streets to map-renderable format for highlighting
  const previewStreetsForMap = useMemo(() => {
    if (!preview?.streets) return [];
    return preview.streets
      .map(previewStreetToMapStreet)
      .filter((s): s is ProjectMapStreet => s !== null);
  }, [preview?.streets]);

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

  // Use user location zoom when available, otherwise default zoom
  const mapZoom =
    geoPosition && !activeShape
      ? MAP_ZOOM.USER_LOCATION
      : activeShape
        ? MAP_ZOOM.PROJECT_DETAIL
        : MAP_ZOOM.DEFAULT;

  const mapSection = (
    <div className="relative h-[40vh] min-h-[240px] w-full md:h-full md:min-h-0">
      <UnifiedMap
        center={{ lat: mapCenter[0], lng: mapCenter[1] }}
        zoom={mapZoom}
        userLocation={geoPosition}
        showUserLocationMarker={showUserLocationMarker}
        streets={previewStreetsForMap}
        highlightOsmIds={highlightOsmIds}
        drawingEnabled
        activeShape={activeShape}
        onShapeChange={setActiveShape}
        activeTool={activeTool}
        onClick={
          activeTool === "marker" ? handleMapClick : undefined
        }
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
        isLoading={geoLoading && !geoPosition}
        loadingMessage="Getting your location…"
        helperText={helperText}
        className="h-full w-full"
      />
    </div>
  );

  return (
    <>
      {/* Full-width layout so map and form card share the same width (no jump). */}
      <div className="-mx-4 w-[calc(100%+2rem)] flex min-h-0 flex-1 flex-col md:mx-0 md:w-full md:flex-row">
        {/* Mobile: map on top. Desktop: map left, form right */}
        <div className="order-1 min-h-[40vh] w-full flex-1 md:order-1 md:min-h-[calc(100vh-120px)]">
          {mapSection}
        </div>
        <aside className="order-2 w-full shrink-0 border-border bg-surface md:order-2 md:h-auto md:min-h-[calc(100vh-120px)] md:w-[380px] md:overflow-y-auto md:border-l-2">
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
    </>
  );
}
