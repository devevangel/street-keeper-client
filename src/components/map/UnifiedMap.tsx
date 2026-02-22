/**
 * UnifiedMap – Single map component for the app.
 * Renders Leaflet map with optional: user location, streets, boundary, drawing tools,
 * heatmap, viewport handler, highlight fit, legend, loading overlay, click handler, marker.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Polygon,
  Marker,
  useMap,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/** Creates the "streetPane" with z-index below default overlayPane so labels show above streets */
function StreetPane() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("streetPane")) {
      const pane = map.createPane("streetPane");
      pane.style.zIndex = "350";
    }
  }, [map]);
  return null;
}

/** Syncs map view when center/zoom props change (including first valid values) */
function MapViewSync({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  const lastCenter = useRef<{ lat: number; lng: number } | null>(null);
  const lastZoom = useRef<number | null>(null);

  useEffect(() => {
    // Only fly if center or zoom actually changed
    const centerChanged =
      !lastCenter.current ||
      Math.abs(lastCenter.current.lat - center.lat) > 0.0001 ||
      Math.abs(lastCenter.current.lng - center.lng) > 0.0001;
    const zoomChanged = lastZoom.current !== zoom;

    if (centerChanged || zoomChanged) {
      map.setView([center.lat, center.lng], zoom, { animate: true });
      lastCenter.current = center;
      lastZoom.current = zoom;
    }
  }, [map, center.lat, center.lng, zoom]);

  return null;
}
import { MapInvalidateSize } from "./MapInvalidateSize";
import { LocationMarker } from "./LocationMarker";
import { UnifiedStreetLayer } from "./UnifiedStreetLayer";
import { DrawingToolbar } from "./DrawingToolbar";
import { HeatmapLayer } from "./HeatmapLayer";
import { MapViewportHandler } from "./MapViewportHandler";
import { FitBoundsToHighlight } from "./FitBoundsToHighlight";
import { MapClickHandler } from "./MapClickHandler";
import { MapLegendFilter, MapLegendGuide, type StreetStatus } from "./MapLegend";
import { MapLoadingOverlay } from "./MapLoadingOverlay";
import { MAP_ZOOM } from "./mapConstants";
import type { ShapeData } from "./DrawingToolbar";
import type { ProjectMapBoundary, MapStreet, ProjectMapStreet } from "../../types/api.types";

export interface MapViewHighlightFocus {
  bbox?: [number, number, number, number];
  streetIds?: number[];
  startPoint?: { lat: number; lng: number };
}

export interface UnifiedMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  className?: string;

  userLocation?: { lat: number; lng: number } | null;
  showUserLocationMarker?: boolean;

  streets?: (MapStreet | ProjectMapStreet)[];
  defaultVisibleStatuses?: Set<StreetStatus>;
  availableStatuses?: StreetStatus[];
  highlightOsmIds?: string[];

  boundary?: ProjectMapBoundary | null;
  showBoundaryOutline?: boolean;

  drawingEnabled?: boolean;
  activeShape?: ShapeData | null;
  onShapeChange?: (shape: ShapeData | null) => void;
  activeTool?: "cursor" | "polygon" | "marker";

  heatmapPoints?: [number, number, number][];
  heatmapBounds?: { north: number; south: number; east: number; west: number };

  onViewportChange?: (center: { lat: number; lng: number }) => void;
  onClick?: (point: { lat: number; lng: number }) => void;
  highlightFocus?: MapViewHighlightFocus | null;

  markerPosition?: { lat: number; lng: number } | null;
  onMarkerClick?: () => void;

  showLegend?: boolean;
  /** Read-only color guide (Completed, Partial, Not run yet). Use on homepage. */
  showLegendGuide?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  helperText?: string;

  showDrawnCircle?: boolean;
}

const DEFAULT_ZOOM = MAP_ZOOM.DEFAULT;

/** Blue marker icon for project create pin (matches highlight blue) */
const markerIcon = L.divIcon({
  html: `<div style="
    width:24px;height:24px;
    background:#2563eb;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 1px 4px rgba(0,0,0,0.4);
  "></div>`,
  className: "unified-map-pin",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapContent(props: UnifiedMapProps) {
  const {
    center,
    zoom = DEFAULT_ZOOM,
    userLocation,
    showUserLocationMarker,
    streets = [],
    defaultVisibleStatuses = new Set<StreetStatus>(["completed", "partial", "not_started"]),
    availableStatuses = ["completed", "partial", "not_started"],
    highlightOsmIds = [],
    boundary,
    showBoundaryOutline,
    drawingEnabled,
    activeShape,
    onShapeChange,
    activeTool = "cursor",
    heatmapPoints = [],
    heatmapBounds,
    onViewportChange,
    onClick,
    highlightFocus,
    markerPosition,
    onMarkerClick,
    showLegend,
    showLegendGuide,
    showDrawnCircle,
  } = props;

  // Safe center with validation
  const safeCenter = {
    lat: Number.isFinite(center?.lat) ? center.lat : 50.8,
    lng: Number.isFinite(center?.lng) ? center.lng : -1.09,
  };

  const [visibleStatuses, setVisibleStatuses] = useState<Set<StreetStatus>>(
    () => new Set(defaultVisibleStatuses)
  );

  // Create set of highlighted osmIds for quick lookup
  const highlightSet = useMemo(() => new Set(highlightOsmIds), [highlightOsmIds]);

  const filteredStreets = useMemo(() => {
    if (!showLegend || !streets.length) return streets;
    // Always include highlighted streets regardless of status filter
    return streets.filter(
      (s) => visibleStatuses.has(s.status) || highlightSet.has(s.osmId)
    );
  }, [streets, showLegend, visibleStatuses, highlightSet]);

  const handleToggleLegend = (status: StreetStatus) => {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  return (
    <>
      <MapInvalidateSize />
      <StreetPane />
      <MapViewSync center={safeCenter} zoom={zoom} />
      {showUserLocationMarker && userLocation && (
        <LocationMarker position={userLocation} />
      )}
      {filteredStreets.length > 0 && (
        <UnifiedStreetLayer
          streets={filteredStreets}
          highlightOsmIds={highlightOsmIds}
        />
      )}
      {showBoundaryOutline && boundary && boundary.type === "circle" && (
        <Circle
          center={[boundary.center.lat, boundary.center.lng]}
          radius={boundary.radiusMeters}
          pathOptions={{
            color: "#2563eb",
            fillOpacity: 0.05,
            weight: 2,
          }}
        />
      )}
      {showBoundaryOutline && boundary && boundary.type === "polygon" && (
        <Polygon
          positions={boundary.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as LatLngTuple)}
          pathOptions={{
            color: "#2563eb",
            fillOpacity: 0.05,
            weight: 2,
          }}
        />
      )}
      {showDrawnCircle && activeShape?.type === "circle" && (
        <Circle
          center={[activeShape.center.lat, activeShape.center.lng]}
          radius={activeShape.radiusMeters}
          pathOptions={{
            color: "#2563eb",
            fillOpacity: 0.05,
            weight: 2,
          }}
        />
      )}
      {drawingEnabled && onShapeChange && (
        <DrawingToolbar
          activeShape={activeShape ?? null}
          onShapeChange={onShapeChange}
          polygonToolActive={activeTool === "polygon"}
        />
      )}
      {heatmapPoints.length > 0 && (
        <HeatmapLayer points={heatmapPoints} bounds={heatmapBounds} />
      )}
      {onViewportChange && <MapViewportHandler onViewportChange={onViewportChange} />}
      {highlightFocus?.bbox && (
        <FitBoundsToHighlight bbox={highlightFocus.bbox} />
      )}
      {onClick && (
        <MapClickHandler
          enabled={true}
          onMapClick={onClick}
        />
      )}
      {markerPosition && (
        <Marker
          position={[markerPosition.lat, markerPosition.lng]}
          icon={markerIcon}
          eventHandlers={onMarkerClick ? { click: onMarkerClick } : undefined}
        />
      )}
      {showLegend && (
        <MapLegendFilter
          visibleStatuses={visibleStatuses}
          onToggle={handleToggleLegend}
          availableStatuses={availableStatuses}
        />
      )}
      {showLegendGuide && <MapLegendGuide />}
    </>
  );
}

export function UnifiedMap(props: UnifiedMapProps) {
  const {
    center,
    zoom = DEFAULT_ZOOM,
    className = "",
    isLoading,
    loadingMessage,
    helperText,
  } = props;

  // Validate center - use fallback if invalid
  const safeCenter = {
    lat: Number.isFinite(center?.lat) ? center.lat : 50.8,
    lng: Number.isFinite(center?.lng) ? center.lng : -1.09,
  };
  const centerTuple: LatLngTuple = [safeCenter.lat, safeCenter.lng];

  return (
    <div className={`relative ${className}`} style={{ minHeight: "400px" }}>
      <MapContainer
        center={centerTuple}
        zoom={zoom}
        className="h-full w-full leaflet-map-theme leaflet-container leaflet-touch leaflet-fade-anim leaflet-grab leaflet-touch-drag leaflet-touch-zoom"
        scrollWheelZoom
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapContent {...props} />
      </MapContainer>
      {isLoading && (
        <MapLoadingOverlay message={loadingMessage} />
      )}
      {helperText && (
        <div
          className="absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded border border-border bg-bg/95 px-3 py-2 text-xs text-text shadow"
          aria-live="polite"
        >
          {helperText}
        </div>
      )}
    </div>
  );
}
