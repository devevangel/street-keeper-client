/**
 * HeatmapLayer – Leaflet heat layer for activity density.
 * Used inside MapContainer. Optionally fits bounds when bounds provided.
 */

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
(window as unknown as { L: typeof L }).L = L;
import "leaflet.heat";

export interface HeatmapLayerProps {
  /** [lat, lng, intensity] tuples */
  points: [number, number, number][];
  /** When set, fit map to these bounds after adding the layer */
  bounds?: { north: number; south: number; east: number; west: number };
}

export function HeatmapLayer({ points, bounds }: HeatmapLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!points.length) return;

    const heatLayerFn = (L as typeof L & {
      heatLayer: (pts: [number, number, number][], o?: object) => L.Layer;
    }).heatLayer;
    const layer = heatLayerFn(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: "blue", 0.6: "lime", 0.8: "yellow", 1: "red" },
    });
    layer.addTo(map);
    layerRef.current = layer;

    if (bounds) {
      const { north, south, east, west } = bounds;
      map.fitBounds(
        [
          [south, west],
          [north, east],
        ],
        { padding: [20, 20], maxZoom: 15 }
      );
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points, bounds]);

  return null;
}
