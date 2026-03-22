/**
 * AnimatedMapDemo
 * Full-screen Leaflet map of a fixed London area (Soho).
 * Fetches REAL streets from Overpass API on first load, caches in localStorage.
 * Animates polylines on actual roads to simulate a user completing streets.
 * Runner animation follows realistic street geometries sequentially.
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

const CACHE_KEY = "sk_landing_streets_v3"; // Updated cache key for new street limit
const MAX_STREETS = 50; // Increased to show ~80% of visible streets

// Tight bounding box around Soho (~300m radius)
const BBOX = {
  south: 51.5100,
  west: -0.1420,
  north: 51.5170,
  east: -0.1320,
};

// Module-level flag to prevent duplicate Overpass API requests across component instances
let fetchInProgress = false;

interface AnimatedMapDemoProps {
  /** Theme for the map tiles. Defaults to light. */
  theme?: "light" | "dark";
}

interface CachedStreet {
  id: number;
  name: string;
  coords: LatLngTuple[];
}

/** Fetch streets from Overpass API for the fixed bounding box */
async function fetchStreetsFromOverpass(): Promise<CachedStreet[]> {
  const query = `
    [out:json][timeout:15];
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
    
    // Prefer named streets, but also include unnamed streets if we need more
    const name = el.tags?.name || `Street ${streets.length + 1}`;
    
    const coords: LatLngTuple[] = el.geometry.map((n: { lat: number; lon: number }) => [n.lat, n.lon]);

    // Avoid duplicates by checking if coordinates are very similar
    const isDuplicate = streets.some((s) => {
      if (s.name === name) return true;
      // Check if coordinates overlap significantly (same street segment)
      const sFirst = s.coords[0];
      const sLast = s.coords[s.coords.length - 1];
      const elFirst = coords[0];
      const elLast = coords[coords.length - 1];
      const threshold = 0.0001; // ~11 meters
      return (
        (Math.abs(sFirst[0] - elFirst[0]) < threshold && Math.abs(sFirst[1] - elFirst[1]) < threshold) ||
        (Math.abs(sLast[0] - elLast[0]) < threshold && Math.abs(sLast[1] - elLast[1]) < threshold)
      );
    });
    
    if (isDuplicate) continue;

    streets.push({ id: streets.length, name, coords });
    if (streets.length >= MAX_STREETS) break;
  }

  return streets;
}

/** Load streets from cache or fetch from API */
async function loadStreets(): Promise<CachedStreet[]> {
  // Check cache synchronously first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedStreet[];
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // Cache miss or corrupt — fetch fresh
  }

  // Prevent duplicate concurrent fetches
  if (fetchInProgress) {
    // Wait for the in-progress fetch to complete
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!fetchInProgress) {
          clearInterval(checkInterval);
          try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
              const parsed = JSON.parse(cached) as CachedStreet[];
              if (parsed.length > 0) {
                resolve(parsed);
                return;
              }
            }
          } catch {
            // Fall through to fallback
          }
          resolve(FALLBACK_STREETS);
        }
      }, 50);
    });
  }

  fetchInProgress = true;
  try {
    const streets = await fetchStreetsFromOverpass();
    if (streets.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(streets));
    }
    return streets;
  } catch (err) {
    console.warn("Failed to fetch landing streets from Overpass:", err);
    return FALLBACK_STREETS;
  } finally {
    fetchInProgress = false;
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

function DemoMapContent({ progress, scaledProgress, streets }: { progress: number; scaledProgress: number; streets: CachedStreet[] }) {
  const total = streets.length;
  if (total === 0) return null;
  const completedCount = Math.floor(scaledProgress * total);
  const inProgressCount = Math.min(1, total - completedCount);

  // Calculate which street is currently being "run" and progress along that street
  const currentStreetIndex = Math.min(completedCount + inProgressCount - 1, total - 1);
  const currentStreet = streets[currentStreetIndex];
  const streetProgress = inProgressCount > 0 
    ? (scaledProgress * total - completedCount) / inProgressCount 
    : 0;

  // Build realistic runner route: animate along the current street's actual geometry
  let runnerRoute: LatLngTuple[] = [];
  if (currentStreet && streetProgress > 0 && currentStreet.coords.length >= 2) {
    const streetCoords = currentStreet.coords;
    const routeLength = Math.max(2, Math.floor(streetProgress * streetCoords.length));
    runnerRoute = streetCoords.slice(0, routeLength);
  }

  return (
    <>
      {/* Render all streets with their status */}
      {streets.map((st, idx) => {
        let color = "#4b5563";
        let weight = 4;
        let opacity = 0.35;

        if (idx < completedCount) {
          color = "#22c55e";
          weight = 5;
          opacity = 0.9;
        } else if (idx === currentStreetIndex && inProgressCount > 0) {
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

      {/* Realistic runner route: follows actual street geometry */}
      {runnerRoute.length >= 2 && (
        <Polyline
          positions={runnerRoute}
          pathOptions={{ 
            color: "#3b82f6", 
            weight: 4, 
            opacity: 0.9, 
            lineCap: "round", 
            lineJoin: "round", 
            dashArray: "8 6" 
          }}
        />
      )}
    </>
  );
}

export function AnimatedMapDemo({ theme: themeProp = "light" }: AnimatedMapDemoProps) {
  const [progress, setProgress] = useState(0);
  const [streets, setStreets] = useState<CachedStreet[]>([]);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const streetsLoadedRef = useRef(false);

  const themeId = themeProp === "dark" ? "dark" : "light";
  const mapTheme = getMapTheme(themeId);
  const tileUrl = getMapTileUrl(mapTheme);
  const attribution = getMapAttribution(mapTheme);

  // Load streets on mount (from cache or API) - only once per component instance
  useEffect(() => {
    if (streetsLoadedRef.current) return;
    streetsLoadedRef.current = true;
    loadStreets().then(setStreets);
  }, []);

  const total = streets.length;
  // Scale progress to 80% max so ~80% of streets light up
  const scaledProgress = Math.min(progress, 0.8);
  const completedCount = Math.floor(scaledProgress * total);
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
          <DemoMapContent progress={progress} scaledProgress={scaledProgress} streets={streets} />
        </MapContainer>
      </div>

      {/* Overlay layer — above map, uses isolate to guarantee stacking */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10, isolation: "isolate" }}
      >
        <div className={`pointer-events-auto absolute bottom-24 left-4 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md border ${
          themeProp === "dark"
            ? "bg-black/95 border-white/10"
            : "bg-white/95 border-gray-200/60 shadow-gray-900/10"
        }`}>
          <div className={`mb-2 text-xs font-semibold uppercase tracking-wider ${
            themeProp === "dark" ? "text-white/60" : "text-gray-500"
          }`}>
            Street Progress
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                <span className={`text-xs ${themeProp === "dark" ? "text-white" : "text-gray-700"}`}>Completed</span>
              </div>
              <span className="min-w-[1.5rem] text-right font-mono text-xs font-bold text-green-500">
                {completedCount}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse"></div>
                <span className={`text-xs ${themeProp === "dark" ? "text-white" : "text-gray-700"}`}>In Progress</span>
              </div>
              <span className="min-w-[1.5rem] text-right font-mono text-xs font-bold text-orange-500">
                {inProgressCount}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-400"></div>
                <span className={`text-xs ${themeProp === "dark" ? "text-white" : "text-gray-700"}`}>Not Started</span>
              </div>
              <span className={`min-w-[1.5rem] text-right font-mono text-xs font-bold ${themeProp === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                {notStartedCount}
              </span>
            </div>
            <div className={`flex items-center gap-2 border-t pt-1.5 ${themeProp === "dark" ? "border-white/20" : "border-gray-200"}`}>
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
              <span className={`text-xs ${themeProp === "dark" ? "text-white/80" : "text-gray-600"}`}>Your Run</span>
            </div>
            <div className={`flex items-center justify-between border-t pt-1.5 ${themeProp === "dark" ? "border-white/20" : "border-gray-200"}`}>
              <span className={`text-[10px] ${themeProp === "dark" ? "text-white/50" : "text-gray-400"}`}>Total</span>
              <span className={`font-mono text-xs font-bold ${themeProp === "dark" ? "text-white" : "text-gray-800"}`}>{total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
