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
import { MapLegendFilterBins, MapLegendGuide } from "./MapLegend";
import { getStreetBin, type FilterStatus } from "../../utils/street-filters";
import { normalizeOsmId } from "../../utils/map-utils";
import { MapLoadingOverlay } from "./MapLoadingOverlay";
import { MAP_ZOOM } from "./mapConstants";
import { getMapTheme, getMapTileUrl, getMapAttribution } from "../../config/map-themes";
import { usePreferences } from "../../contexts/PreferencesContext";
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
  /** Read-only color guide (Completed, Almost there, In progress, Not started). Use on homepage. */
  showLegendGuide?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  helperText?: string;

  showDrawnCircle?: boolean;
}

const DEFAULT_ZOOM = MAP_ZOOM.DEFAULT;

/** Purple marker icon for project create pin (distinct from street status colors) */
const markerIcon = L.divIcon({
  html: `<div style="
    width:24px;height:24px;
    background:#7c3aed;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 1px 4px rgba(0,0,0,0.4);
  "></div>`,
  className: "unified-map-pin",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const AVAILABLE_BINS: FilterStatus[] = ["completed", "almostThere", "inProgress", "notStarted"];

function MapContent(props: UnifiedMapProps) {
  const {
    center,
    zoom = DEFAULT_ZOOM,
    userLocation,
    showUserLocationMarker,
    streets = [],
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

  const [visibleBins, setVisibleBins] = useState<Set<FilterStatus>>(
    () => new Set(AVAILABLE_BINS)
  );

  // Create set of highlighted osmIds for quick lookup (normalized for consistent comparison)
  const highlightSet = useMemo(
    () => new Set(highlightOsmIds.map(normalizeOsmId)),
    [highlightOsmIds]
  );

  // Compute bin counts from streets
  const binCounts = useMemo(() => {
    const counts: Record<FilterStatus, number> = {
      all: 0,
      completed: 0,
      almostThere: 0,
      inProgress: 0,
      notStarted: 0,
    };
    for (const s of streets) {
      const completed = s.status === "completed";
      const bin = getStreetBin(s.percentage ?? 0, completed);
      if (bin !== "all") counts[bin]++;
    }
    return counts;
  }, [streets]);

  const filteredStreets = useMemo(() => {
    if (!showLegend || !streets.length) return streets;
    return streets.filter((s) => {
      const completed = s.status === "completed";
      const bin = getStreetBin(s.percentage ?? 0, completed);
      return visibleBins.has(bin) || highlightSet.has(normalizeOsmId(s.osmId));
    });
  }, [streets, showLegend, visibleBins, highlightSet]);

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
            color: "#7c3aed",
            weight: 2,
            fill: false,
            interactive: false,
          }}
        />
      )}
      {showBoundaryOutline && boundary && boundary.type === "polygon" && (
        <Polygon
          positions={boundary.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as LatLngTuple)}
          pathOptions={{
            color: "#7c3aed",
            weight: 2,
            fill: false,
            interactive: false,
          }}
        />
      )}
      {showDrawnCircle && activeShape?.type === "circle" && (
        <Circle
          center={[activeShape.center.lat, activeShape.center.lng]}
          radius={activeShape.radiusMeters}
          pathOptions={{
            color: "#7c3aed",
            weight: 2,
            fill: false,
            interactive: false,
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
        <MapLegendFilterBins
          visibleBins={visibleBins}
          onToggle={(bin) => {
            setVisibleBins((prev) => {
              const next = new Set(prev);
              if (next.has(bin)) next.delete(bin);
              else next.add(bin);
              return next;
            });
          }}
          counts={binCounts}
          onShowAll={() => setVisibleBins(new Set(AVAILABLE_BINS))}
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

  const prefsCtx = usePreferences();
  const mapTheme = getMapTheme(prefsCtx?.preferences?.mapStyle);
  const tileUrl = getMapTileUrl(mapTheme);
  const attribution = getMapAttribution(mapTheme);
  const isMapbox = tileUrl.includes("mapbox.com");

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
          attribution={attribution}
          url={tileUrl}
          {...(isMapbox ? { tileSize: 512, zoomOffset: -1 } : {})}
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
