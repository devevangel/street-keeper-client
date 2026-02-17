/**
 * MapView Component
 * Interactive Leaflet map showing user location and street polylines (completed = green, partial = yellow).
 * Uses OpenStreetMap tiles. Renders inside a fixed-height container so the map initializes correctly.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl, Marker, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import type { MapStreet } from "../../types/api.types";
import { LocationMarker } from "./LocationMarker";
import { MapLegendFilter, type StreetStatus } from "./MapLegend";
import { StreetLayer } from "./StreetLayer";

/** Create custom pane for streets with lower z-index so polylines render below overlays. */
function StreetPane() {
  const map = useMap();
  useLayoutEffect(() => {
    if (!map.getPane("streetPane")) {
      const pane = map.createPane("streetPane");
      pane.style.zIndex = "350";
    }
  }, [map]);
  return null;
}

/** Fix Leaflet black map when container gets size after mount (e.g. mobile flex layout). */
function MapInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const run = () => map.invalidateSize();
    run();
    const ro = new ResizeObserver(run);
    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

/** Default center when position is not yet available (e.g. UK). */
const DEFAULT_CENTER: LatLngTuple = [50, -1];

/** Zoom when centered on user. 19 is OpenStreetMap’s max tile zoom – any higher looks blurry. */
const ZOOM_USER = 19;

/** Zoom when using default center. */
const ZOOM_DEFAULT = 10;
const PAN_DEBOUNCE_MS = 600;

function MapViewportHandler({
  onViewportChange,
}: {
  onViewportChange: (center: { lat: number; lng: number }) => void;
}) {
  const map = useMap();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const c = map.getCenter();
        onViewportChange({ lat: c.lat, lng: c.lng });
        debounceRef.current = null;
      }, PAN_DEBOUNCE_MS);
    };
    map.on("moveend", handler);
    return () => {
      map.off("moveend", handler);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [map, onViewportChange]);

  return null;
}

/** Min distance (m) between target and current map center to trigger flyTo. Avoids resetting zoom when user only panned/zoomed. */
const FLY_TO_THRESHOLD_M = 50;

function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** When highlightFocus.bbox is set, fit map to that bounds (e.g. "Show on map"). */
function FitBoundsToHighlight({
  bbox,
}: {
  bbox: [number, number, number, number];
}) {
  const map = useMap();
  useEffect(() => {
    const [minLat, minLng, maxLat, maxLng] = bbox;
    map.fitBounds(
      [
        [minLat, minLng],
        [maxLat, maxLng],
      ] as LatLngTuple[],
      { padding: [20, 20], maxZoom: 18 }
    );
  }, [map, bbox[0], bbox[1], bbox[2], bbox[3]]);
  return null;
}

/** Syncs the map view only when jumping to a new place (search / "use my location"). Does not run when user pans or zooms. */
function MapCenterSync({
  center,
  zoom,
}: {
  center: LatLngTuple;
  zoom: number;
}) {
  const map = useMap();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const current = map.getCenter();
    const target = { lat: center[0], lng: center[1] };
    const dist = distanceMeters(
      target,
      { lat: current.lat, lng: current.lng }
    );
    if (dist >= FLY_TO_THRESHOLD_M) {
      map.flyTo(center, zoom, { duration: 0.5 });
    }
  }, [map, center[0], center[1], zoom]);

  return null;
}

export interface MapViewHighlightFocus {
  bbox: [number, number, number, number];
  streetIds?: number[];
  startPoint?: { lat: number; lng: number };
}

export interface MapViewProps {
  /** Map center (from search or user location). Used for viewport and data. */
  mapCenter: { lat: number; lng: number } | null;
  /** User's current position (blue dot). Shown when available. */
  userLocation: { lat: number; lng: number } | null;
  /** Streets from GET /map/streets to draw as polylines. */
  streets: MapStreet[];
  /** Optional CSS class for the wrapper div (e.g. height). Defaults to h-[65vh] min-h-[400px] w-full. */
  className?: string;
  /** Called when the user pans the map (debounced). Use to load streets for the new center. */
  onViewportChange?: (center: { lat: number; lng: number }) => void;
  /** When set, fit bounds to bbox, highlight these street IDs, and show start marker. */
  highlightFocus?: MapViewHighlightFocus | null;
  /** Initial visible statuses (default: completed and partial). */
  defaultVisibleStatuses?: Set<StreetStatus>;
  /** Which status toggles to show in legend (default: completed, partial). */
  availableStatuses?: StreetStatus[];
}

const defaultIcon = L.divIcon({
  className: "start-marker",
  html: '<div style="width:14px;height:14px;background:#10b981;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export function MapView({
  mapCenter,
  userLocation,
  streets,
  className = "h-[65vh] min-h-[400px] w-full",
  onViewportChange,
  highlightFocus,
  defaultVisibleStatuses = new Set<StreetStatus>(["completed", "partial"]),
  availableStatuses = ["completed", "partial"],
}: MapViewProps) {
  const [visibleStatuses, setVisibleStatuses] = useState<Set<StreetStatus>>(
    () => new Set(defaultVisibleStatuses)
  );

  const handleToggleStatus = useCallback((status: StreetStatus) => {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const highlightOsmIds =
    highlightFocus?.streetIds?.map((id) => `way/${id}`) ?? [];
  const highlightSet = useMemo(
    () => new Set(highlightOsmIds),
    [highlightOsmIds.join(",")]
  );

  const filteredStreets = useMemo(
    () =>
      streets.filter(
        (s) =>
          visibleStatuses.has(s.status as StreetStatus) ||
          highlightSet.has(s.osmId)
      ),
    [streets, visibleStatuses, highlightSet]
  );

  const center: LatLngTuple = mapCenter
    ? [mapCenter.lat, mapCenter.lng]
    : userLocation
      ? [userLocation.lat, userLocation.lng]
      : DEFAULT_CENTER;
  const zoom = mapCenter || userLocation ? ZOOM_USER : ZOOM_DEFAULT;

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        maxZoom={19}
        className="h-full w-full leaflet-map-theme"
        scrollWheelZoom
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <StreetPane />
        <MapInvalidateSize />
        <MapCenterSync center={center} zoom={zoom} />
        {onViewportChange && (
          <MapViewportHandler onViewportChange={onViewportChange} />
        )}
        {highlightFocus?.bbox && (
          <FitBoundsToHighlight bbox={highlightFocus.bbox} />
        )}
        <ZoomControl position="bottomright" />
        <LocationMarker position={userLocation} />
        <StreetLayer streets={filteredStreets} highlightOsmIds={highlightOsmIds} />
        {highlightFocus?.startPoint && (
          <Marker
            position={[highlightFocus.startPoint.lat, highlightFocus.startPoint.lng]}
            icon={defaultIcon}
          >
            <Popup>Start here</Popup>
          </Marker>
        )}
      </MapContainer>
      <MapLegendFilter
        visibleStatuses={visibleStatuses}
        onToggle={handleToggleStatus}
        availableStatuses={availableStatuses}
      />
    </div>
  );
}
