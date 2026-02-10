/**
 * ProjectHeatmap
 * Leaflet map with heatmap layer showing activity density.
 * Uses leaflet.heat (L.heatLayer).
 */

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
// leaflet.heat expects L on window
(window as unknown as { L: typeof L }).L = L;
import "leaflet.heat";
import type { ProjectHeatmapData } from "../../types/api.types";

export interface ProjectHeatmapProps {
  heatmapData: ProjectHeatmapData;
}

export function ProjectHeatmap({ heatmapData }: ProjectHeatmapProps) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!heatmapData.points.length) return;

    const heatLayerFn = (L as typeof L & { heatLayer: (points: [number, number, number][], o?: object) => L.Layer }).heatLayer;
    const layer = heatLayerFn(heatmapData.points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: "blue", 0.6: "lime", 0.8: "yellow", 1: "red" },
    });
    layer.addTo(map);
    layerRef.current = layer;

    const { north, south, east, west } = heatmapData.bounds;
    map.fitBounds(
      [
        [south, west],
        [north, east],
      ],
      { padding: [20, 20], maxZoom: 15 }
    );

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, heatmapData]);

  return null;
}
