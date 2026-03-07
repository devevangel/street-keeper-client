/**
 * AnimatedMapDemo
 * Full-screen Leaflet map of a fixed London area (Soho).
 * Fetches REAL streets from Overpass API on first load, caches in localStorage.
 * Animates polylines on actual roads to simulate a user completing streets.
 */

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMapTheme, getMapTileUrl, getMapAttribution } from "../../config/map-themes";

// Fixed location: Soho, London — dense streets, iconic, recognizable names
const CENTER: LatLngTuple = [51.5133, -0.1370];
const ZOOM = 18;
const DURATION_MS = 20000; // 20 seconds per loop

const CACHE_KEY = "sk_landing_streets_v1";
const MAX_STREETS = 4;

// Tight bounding box around Soho (~300m radius)
const BBOX = {
  south: 51.5120,
  west: -0.1400,
  north: 51.5150,
  east: -0.1340,
};

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.documentElement.classList.contains("dark") ||
    document.documentElement.getAttribute("data-theme") === "dark" ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

interface CachedStreet {
  id: number;
  name: string;
  coords: LatLngTuple[];
}

/** Fetch streets from Overpass API for the fixed bounding box */
async function fetchStreetsFromOverpass(): Promise<CachedStreet[]> {
  const query = `
    [out:json][timeout:10];
    way["highway"~"^(residential|tertiary|secondary|primary|unclassified|living_street|pedestrian)$"]
      (${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
    out geom;
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);

  const data = await res.json();
  const streets: CachedStreet[] = [];

  for (const el of data.elements) {
    if (el.type !== "way" || !el.geometry || el.geometry.length < 2) continue;
    const name = el.tags?.name;
    if (!name) continue; // Only named streets

    const coords: LatLngTuple[] = el.geometry.map((n: { lat: number; lon: number }) => [n.lat, n.lon]);

    // Avoid duplicates by name
    if (streets.some((s) => s.name === name)) continue;

    streets.push({ id: streets.length, name, coords });
    if (streets.length >= MAX_STREETS) break;
  }

  return streets;
}

/** Load streets from cache or fetch from API */
async function loadStreets(): Promise<CachedStreet[]> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedStreet[];
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // Cache miss or corrupt — fetch fresh
  }

  try {
    const streets = await fetchStreetsFromOverpass();
    if (streets.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(streets));
    }
    return streets;
  } catch (err) {
    console.warn("Failed to fetch landing streets from Overpass:", err);
    return FALLBACK_STREETS;
  }
}

// Fallback if Overpass is down — a few real Soho streets
const FALLBACK_STREETS: CachedStreet[] = [
  {
    id: 0, name: "Wardour Street",
    coords: [[51.5148, -0.1374], [51.5142, -0.1372], [51.5135, -0.1370], [51.5128, -0.1368], [51.5121, -0.1366]],
  },
  {
    id: 1, name: "Old Compton Street",
    coords: [[51.5133, -0.1395], [51.5133, -0.1382], [51.5134, -0.1370], [51.5134, -0.1358], [51.5134, -0.1345]],
  },
  {
    id: 2, name: "Frith Street",
    coords: [[51.5148, -0.1360], [51.5143, -0.1359], [51.5138, -0.1358], [51.5133, -0.1357], [51.5128, -0.1356]],
  },
  {
    id: 3, name: "Dean Street",
    coords: [[51.5148, -0.1348], [51.5143, -0.1348], [51.5138, -0.1347], [51.5133, -0.1346], [51.5128, -0.1345]],
  },
];

function MapSizeInvalidator() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t = setTimeout(() => map.invalidateSize(), 200);
    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);
  return null;
}

function DemoMapContent({ progress, streets }: { progress: number; streets: CachedStreet[] }) {
  const total = streets.length;
  if (total === 0) return null;

  const completedCount = Math.floor(progress * total);
  const inProgressCount = Math.min(1, total - completedCount);

  // Build runner route from completed + in-progress streets
  const routeStreets = streets.slice(0, completedCount + inProgressCount);
  const runnerCoords: LatLngTuple[] = [];
  for (const st of routeStreets) {
    for (const c of st.coords) {
      runnerCoords.push(c);
    }
  }
  const routeLen = Math.max(2, Math.floor(progress * runnerCoords.length));
  const visibleRoute = runnerCoords.slice(0, routeLen);

  return (
    <>
      {streets.map((st, idx) => {
        let color = "#4b5563";
        let weight = 4;
        let opacity = 0.35;

        if (idx < completedCount) {
          color = "#22c55e";
          weight = 5;
          opacity = 0.9;
        } else if (idx < completedCount + inProgressCount) {
          color = "#f97316";
          weight = 5;
          opacity = 0.8;
        }

        return (
          <Polyline
            key={`street-${st.id}`}
            positions={st.coords}
            pathOptions={{ color, weight, opacity, lineCap: "round", lineJoin: "round" }}
          />
        );
      })}

      {visibleRoute.length >= 2 && (
        <Polyline
          positions={visibleRoute}
          pathOptions={{ color: "#3b82f6", weight: 4, opacity: 0.9, lineCap: "round", lineJoin: "round", dashArray: "8 6" }}
        />
      )}
    </>
  );
}

export function AnimatedMapDemo() {
  const isDark = isDarkMode();
  const [progress, setProgress] = useState(0);
  const [streets, setStreets] = useState<CachedStreet[]>([]);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const themeId = isDark ? "dark" : "streets";
  const theme = getMapTheme(themeId);
  const tileUrl = getMapTileUrl(theme);
  const attribution = getMapAttribution(theme);

  // Load streets on mount (from cache or API)
  useEffect(() => {
    loadStreets().then(setStreets);
  }, []);

  const total = streets.length;
  const completedCount = Math.floor(progress * total);
  const inProgressCount = Math.min(1, total - completedCount);
  const notStartedCount = Math.max(0, total - completedCount - inProgressCount);

  // Animation loop
  useEffect(() => {
    let animating = true;
    const tick = (now: number) => {
      if (!animating) return;
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / DURATION_MS);
      setProgress(t);
      if (t >= 1) startRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      animating = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 h-full w-full">
      {/* Map layer — explicit z-0 so overlays can stack above */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <MapContainer
          center={CENTER}
          zoom={ZOOM}
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={true}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          keyboard={false}
        >
          <TileLayer url={tileUrl} attribution={attribution} />
          <MapSizeInvalidator />
          <DemoMapContent progress={progress} streets={streets} />
        </MapContainer>
      </div>

      {/* Overlay layer — above map, uses isolate to guarantee stacking */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10, isolation: "isolate" }}
      >
        <div className="pointer-events-auto absolute bottom-24 left-4 rounded-xl bg-black/95 px-4 py-3 shadow-2xl backdrop-blur-md border border-white/10">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
            Street Progress
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                <span className="text-xs text-white">Completed</span>
              </div>
              <span className="min-w-[1.5rem] text-right font-mono text-xs font-bold text-green-400">
                {completedCount}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-xs text-white">In Progress</span>
              </div>
              <span className="min-w-[1.5rem] text-right font-mono text-xs font-bold text-orange-400">
                {inProgressCount}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-500"></div>
                <span className="text-xs text-white">Not Started</span>
              </div>
              <span className="min-w-[1.5rem] text-right font-mono text-xs font-bold text-gray-400">
                {notStartedCount}
              </span>
            </div>
            <div className="flex items-center gap-2 border-t border-white/20 pt-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
              <span className="text-xs text-white/80">Your Run</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/20 pt-1.5">
              <span className="text-[10px] text-white/50">Total</span>
              <span className="font-mono text-xs font-bold text-white">{total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
