/**
 * Read-only Leaflet mini-map: run path + highlighted streets with optional stroke-draw animation.
 */

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { usePreferences } from "../../contexts/PreferencesContext";
import {
  getMapAttribution,
  getMapTheme,
  getMapTileUrls,
} from "../../config/map-themes";
import { MAP_ZOOM } from "../map/mapConstants";
import type { CelebrationMapData } from "../../services/celebrations.service";

const RUN_COLOR = "#64748b";
const IMPROVED_COLOR = "#3b82f6";
const STARTED_COLOR = "#ca8a04";
const COMPLETED_COLOR = "#16a34a";

function EnsureMiniMapPanes() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("streetPane")) {
      const pane = map.createPane("streetPane");
      pane.style.zIndex = "350";
    }
    if (!map.getPane("labelsPane")) {
      const pane = map.createPane("labelsPane");
      pane.style.zIndex = "450";
      pane.style.pointerEvents = "none";
    }
  }, [map]);
  return null;
}

/**
 * Pad a bbox by a relative factor (0.3 = 30% on each side).
 * Used to give the user some room to pan around the celebration area.
 */
function padBbox(bbox: CelebrationMapData["bbox"], factor: number) {
  const latSpan = bbox.north - bbox.south;
  const lngSpan = bbox.east - bbox.west;
  const latPad = latSpan * factor;
  const lngPad = lngSpan * factor;
  return {
    south: bbox.south - latPad,
    north: bbox.north + latPad,
    west: bbox.west - lngPad,
    east: bbox.east + lngPad,
  };
}

function FitAndConstrainBounds({
  bbox,
}: {
  bbox: CelebrationMapData["bbox"];
}) {
  const map = useMap();
  useEffect(() => {
    const sw: LatLngExpression = [bbox.south, bbox.west];
    const ne: LatLngExpression = [bbox.north, bbox.east];
    const dataBounds = L.latLngBounds(sw, ne);
    map.invalidateSize();
    map.fitBounds(dataBounds, { padding: [18, 18], maxZoom: 18, animate: false });

    const padded = padBbox(bbox, 0.5);
    const maxBounds = L.latLngBounds(
      [padded.south, padded.west],
      [padded.north, padded.east],
    );
    map.setMaxBounds(maxBounds);

    const currentZoom = map.getZoom();
    map.setMinZoom(Math.max((currentZoom ?? 14) - 2, 12));
  }, [map, bbox.south, bbox.west, bbox.north, bbox.east]);
  return null;
}

function AnimatedStreetPolyline({
  positions,
  color,
  weight,
  delayMs,
  prefersReducedMotion,
}: {
  positions: LatLngExpression[];
  color: string;
  weight: number;
  delayMs: number;
  prefersReducedMotion: boolean;
}) {
  const ref = useRef<L.Polyline>(null);

  useEffect(() => {
    const poly = ref.current;
    if (!poly || positions.length < 2) return;
    const el = poly.getElement() as SVGPathElement | null | undefined;
    if (!el || prefersReducedMotion) return;

    const len = el.getTotalLength();
    if (!Number.isFinite(len) || len <= 0) return;

    el.style.transition = "none";
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);

    const raf = requestAnimationFrame(() => {
      el.style.transition = `stroke-dashoffset 650ms ease-out ${delayMs}ms`;
      el.style.strokeDashoffset = "0";
    });

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [positions, delayMs, prefersReducedMotion, color]);

  return (
    <Polyline
      ref={ref}
      pane="streetPane"
      positions={positions}
      pathOptions={{
        color,
        weight,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round",
      }}
    />
  );
}

export interface CelebrationMiniMapProps {
  data: CelebrationMapData;
  prefersReducedMotion: boolean;
}

export default function CelebrationMiniMap({
  data,
  prefersReducedMotion,
}: CelebrationMiniMapProps) {
  const prefs = usePreferences();
  const mapTheme = getMapTheme(prefs?.preferences?.mapStyle);
  const { base: baseTileUrl, labels: labelsTileUrl, isMapbox } = getMapTileUrls(mapTheme);
  const attribution = getMapAttribution(mapTheme);

  const center: LatLngExpression = useMemo(() => {
    const { south, west, north, east } = data.bbox;
    return [(south + north) / 2, (west + east) / 2];
  }, [data.bbox]);

  const hasGeometry =
    data.runs.some((r) => r.path.length >= 2) || data.streets.some((s) => s.path.length >= 2);

  const streetOrder = useMemo(() => {
    const improved = data.streets.filter((s) => s.bucket === "improved");
    const started = data.streets.filter((s) => s.bucket === "started");
    const completed = data.streets.filter((s) => s.bucket === "completed");
    return [...improved, ...started, ...completed];
  }, [data.streets]);

  if (!hasGeometry) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-xl border border-border bg-card-bg text-sm text-text-muted sm:h-64">
        No GPS track for this activity yet.
      </div>
    );
  }

  let streetIndex = 0;

  return (
    <div className="h-48 w-full overflow-hidden rounded-xl border border-border sm:h-64">
      <MapContainer
        center={center}
        zoom={16}
        maxZoom={MAP_ZOOM.MAX}
        className="h-full w-full [&_.leaflet-control-attribution]:text-[10px] [&_.leaflet-control-zoom]:border-border [&_.leaflet-control-zoom_a]:bg-card-bg [&_.leaflet-control-zoom_a]:text-text-muted"
        dragging
        touchZoom
        doubleClickZoom={false}
        scrollWheelZoom
        zoomControl
        keyboard={false}
        attributionControl
        preferCanvas={false}
      >
        <EnsureMiniMapPanes />
        <TileLayer
          attribution={attribution}
          url={baseTileUrl}
          maxNativeZoom={19}
          maxZoom={MAP_ZOOM.MAX}
          {...(isMapbox ? { tileSize: 512, zoomOffset: -1 } : {})}
        />
        {!isMapbox && (
          <TileLayer
            url={labelsTileUrl}
            maxNativeZoom={19}
            maxZoom={MAP_ZOOM.MAX}
            pane="labelsPane"
          />
        )}
        <FitAndConstrainBounds bbox={data.bbox} />
        {data.runs.map((run) =>
          run.path.length >= 2 ? (
            <Polyline
              key={run.activityId}
              pane="streetPane"
              positions={run.path as LatLngExpression[]}
              pathOptions={{
                color: RUN_COLOR,
                weight: 3,
                opacity: 0.85,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          ) : null,
        )}
        {streetOrder.map((s) => {
          const color =
            s.bucket === "completed"
              ? COMPLETED_COLOR
              : s.bucket === "started"
                ? STARTED_COLOR
                : IMPROVED_COLOR;
          const delay = Math.min(streetIndex * 80, 240);
          streetIndex += 1;
          const pos = s.path as LatLngExpression[];
          if (pos.length < 2) return null;
          return (
            <AnimatedStreetPolyline
              key={`${s.osmId}-${s.bucket}`}
              positions={pos}
              color={color}
              weight={5}
              delayMs={delay}
              prefersReducedMotion={prefersReducedMotion}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
