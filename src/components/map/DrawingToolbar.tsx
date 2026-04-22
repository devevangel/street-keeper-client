/**
 * DrawingToolbar – Geoman integration for project area drawing.
 * Polygon draw/edit/delete; one shape at a time. Circle is handled by parent.
 */

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { Map } from "leaflet";

// Extend Leaflet Map with Geoman (adds map.pm)
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

export type ShapeData =
  | {
      type: "circle";
      center: { lat: number; lng: number };
      radiusMeters: number;
    }
  | { type: "polygon"; coordinates: [number, number][] };

function getPolygonCoordinatesFromLayer(layer: { getLatLngs?: () => unknown }): [number, number][] {
  const latlngs = layer.getLatLngs?.();
  if (!Array.isArray(latlngs) || latlngs.length === 0) return [];
  // Geoman polygon returns nested array: [[LatLng, LatLng, ...]] for outer ring
  // Handle both nested and flat array structures
  const ring = (Array.isArray(latlngs[0]) ? latlngs[0] : latlngs) as Array<{ lat: number; lng: number }>;
  return ring.map((p) => [p.lng, p.lat] as [number, number]);
}

interface DrawingToolbarProps {
  onShapeChange: (shape: ShapeData | null) => void;
  /** When set to circle or null, clear any Geoman polygon so only one shape is active */
  activeShape: ShapeData | null;
  /** When false (e.g. circle mode), disable polygon drawing so map clicks go to parent */
  polygonToolActive: boolean;
}

export function DrawingToolbar({
  onShapeChange,
  activeShape,
  polygonToolActive,
}: DrawingToolbarProps) {
  const map = useMap();
  const pmRef = useRef<Map & { pm?: { getGeomanLayers: () => unknown[]; removeControls: () => void; disableDraw: () => void; enableDraw: (shape: string) => void } } | null>(null);
  // Track the latest activeShape so the pm:remove listener can check it.
  const activeShapeRef = useRef(activeShape);
  activeShapeRef.current = activeShape;

  useEffect(() => {
    const m = map as unknown as Map & {
      pm?: {
        addControls: (opts: Record<string, boolean | string>) => void;
        getGeomanLayers: () => { getLatLngs?: () => unknown }[];
        removeControls: () => void;
        setGlobalOptions: (opts: { continueDrawing?: boolean }) => void;
        disableDraw: () => void;
        enableDraw: (shape: string) => void;
      };
    };
    if (!m.pm) return;
    pmRef.current = m as Map & { pm?: { getGeomanLayers: () => unknown[]; removeControls: () => void; disableDraw: () => void; enableDraw: (s: string) => void } };

    m.pm.removeControls();
    m.pm.setGlobalOptions({ continueDrawing: false });

    const onCreate = (e: { layer?: { getLatLngs?: () => unknown } }) => {
      const layer = e.layer;
      if (!layer) return;
      const coords = getPolygonCoordinatesFromLayer(layer);
      if (coords.length >= 3) {
        onShapeChange({ type: "polygon", coordinates: coords });
      }
    };

    const onEdit = (e: { target?: { getLatLngs?: () => unknown } }) => {
      const layer = e.target;
      if (!layer) return;
      const coords = getPolygonCoordinatesFromLayer(layer);
      if (coords.length >= 3) {
        onShapeChange({ type: "polygon", coordinates: coords });
      }
    };

    const onRemove = () => {
      // Only clear activeShape if the current shape is a polygon (Geoman-managed).
      // Circle shapes are managed by React, not Geoman — ignore pm:remove for them.
      if (activeShapeRef.current?.type !== "polygon") return;
      onShapeChange(null);
    };

    m.on("pm:create", onCreate);
    m.on("pm:edit", onEdit);
    m.on("pm:remove", onRemove);

    return () => {
      m.off("pm:create", onCreate);
      m.off("pm:edit", onEdit);
      m.off("pm:remove", onRemove);
      m.pm?.removeControls();
      pmRef.current = null;
    };
  }, [map, onShapeChange]);

  // When active shape is circle or null, clear Geoman layers so only one shape exists.
  useEffect(() => {
    if (activeShape?.type === "polygon") return;
    const m = map as unknown as { pm?: { getGeomanLayers: () => unknown[] } };
    const layers = m.pm?.getGeomanLayers?.() ?? [];
    layers.forEach((layer: unknown) => {
      const l = layer as { remove?: () => void };
      l.remove?.();
    });
  }, [map, activeShape?.type]);

  // When not in polygon mode, disable drawing so map clicks go to parent (e.g. circle center)
  useEffect(() => {
    const m = map as unknown as { pm?: { disableDraw: () => void; enableDraw: (s: string) => void } };
    if (!m.pm) return;
    if (polygonToolActive) {
      m.pm.enableDraw?.("Polygon");
    } else {
      m.pm.disableDraw?.();
    }
  }, [map, polygonToolActive]);

  return null;
}
