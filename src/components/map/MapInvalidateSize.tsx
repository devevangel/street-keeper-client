/**
 * Fix Leaflet black map when container gets size after mount (e.g. mobile flex layout).
 * Call invalidateSize on mount and when container resizes.
 */

import { useEffect } from "react";
import { useMap } from "react-leaflet";

export function MapInvalidateSize() {
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
