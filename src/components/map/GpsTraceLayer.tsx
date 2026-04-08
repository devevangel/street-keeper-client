/**
 * GpsTraceLayer – Renders GPS activity traces as thin polylines (CityStrides-style).
 * Rendered below the street coverage layer. No popups or interactivity.
 * Each trace fades in over ~400ms when it first appears.
 */

import { useEffect, useMemo, useState } from "react";
import { Polyline } from "react-leaflet";
import type { LatLngTuple, PathOptions } from "leaflet";
import type { GpsTrace } from "../../types/api.types";
import { GPS_TRACE_STYLE } from "./mapConstants";

const TRACE_FADE_MS = 400;

function useTraceFadeFactor(traceId: string) {
  const [factor, setFactor] = useState(0);
  useEffect(() => {
    setFactor(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / TRACE_FADE_MS);
      setFactor(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [traceId]);
  return factor;
}

function TracePolyline({
  id,
  positions,
  pathOptions,
}: {
  id: string;
  positions: LatLngTuple[];
  pathOptions: PathOptions;
}) {
  const fade = useTraceFadeFactor(id);
  return (
    <Polyline
      positions={positions}
      pathOptions={{
        ...pathOptions,
        opacity: (pathOptions.opacity ?? GPS_TRACE_STYLE.OPACITY) * fade,
      }}
    />
  );
}

interface GpsTraceLayerProps {
  traces: GpsTrace[];
  /** When set, this trace is emphasized; others are dimmed. */
  highlightActivityId?: string | null;
}

/**
 * Convert trace coordinates [lat, lng][] to Leaflet positions.
 * Backend returns [lat, lng] so we use them directly.
 */
function toPositions(coords: [number, number][]): LatLngTuple[] {
  return coords.filter(
    (c) =>
      Array.isArray(c) &&
      c.length >= 2 &&
      Number.isFinite(c[0]) &&
      Number.isFinite(c[1])
  ) as LatLngTuple[];
}

export function GpsTraceLayer({
  traces,
  highlightActivityId = null,
}: GpsTraceLayerProps) {
  const polylines = useMemo(() => {
    return traces
      .map((trace) => ({
        id: trace.activityId,
        positions: toPositions(trace.coordinates),
      }))
      .filter((p) => p.positions.length >= 2);
  }, [traces]);

  if (polylines.length === 0) return null;

  const hasHighlight = highlightActivityId != null && highlightActivityId !== "";

  return (
    <>
      {polylines.map(({ id, positions }) => {
        const isHi = hasHighlight && id === highlightActivityId;
        const pathOptions: PathOptions = {
          color: isHi ? "#7C3AED" : GPS_TRACE_STYLE.COLOR,
          weight: isHi ? GPS_TRACE_STYLE.WEIGHT + 3 : GPS_TRACE_STYLE.WEIGHT,
          opacity: hasHighlight ? (isHi ? 1 : 0.12) : GPS_TRACE_STYLE.OPACITY,
          lineCap: GPS_TRACE_STYLE.LINE_CAP,
          lineJoin: GPS_TRACE_STYLE.LINE_JOIN,
        };
        return (
          <TracePolyline key={id} id={id} positions={positions} pathOptions={pathOptions} />
        );
      })}
    </>
  );
}
