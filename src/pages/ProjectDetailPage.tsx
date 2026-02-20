/**
 * ProjectDetailPage
 * Simplified project view: left side map, right side street list with filters.
 * Streets grouped by name with clickable filter pills and map highlighting.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button, Card, StreetListItem, type StreetListItemData } from "../components/common";
import { UnifiedMap } from "../components/map";
import { MAP_ZOOM } from "../components/map/mapConstants";
import { MilestonesSection } from "../components/milestones/MilestonesSection";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { ROUTES } from "../config/constants";
import type { ProjectDetail, ProjectMapData, ProjectMapStreet } from "../types/api.types";
import { groupProjectMapStreetsByName } from "../utils/group-streets-by-name";
import { FILTER_PILLS, getStreetBin, type FilterStatus } from "../utils/street-filters";
import { usePreferences } from "../contexts/PreferencesContext";

/** Normalize osmId to "way/..." for consistent map highlighting */
function normalizeOsmId(osmId: string): string {
  return osmId.startsWith("way/") ? osmId : `way/${osmId}`;
}

/** Compute bbox from street geometries for fitBounds */
function computeBboxFromStreets(
  streets: ProjectMapStreet[]
): [number, number, number, number] {
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;
  for (const s of streets) {
    const coords = s.geometry?.coordinates ?? [];
    for (const [lng, lat] of coords) {
      if (lat < minLat) minLat = lat;
      if (lng < minLng) minLng = lng;
      if (lat > maxLat) maxLat = lat;
      if (lng > maxLng) maxLng = lng;
    }
  }
  if (minLat === Infinity) return [0, 0, 0, 0];
  return [minLat, minLng, maxLat, maxLng];
}

/** Compute bounding box from boundary for fitting map view */
function computeBoundaryBbox(
  boundary: ProjectMapData["boundary"]
): [number, number, number, number] | null {
  if (boundary.type === "circle") {
    const { center, radiusMeters } = boundary;
    const latDeg = radiusMeters / 111320;
    const lngDeg = radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));
    return [
      center.lat - latDeg,
      center.lng - lngDeg,
      center.lat + latDeg,
      center.lng + lngDeg,
    ];
  }
  const coords = boundary.coordinates;
  if (!coords.length) return null;
  let minLat = coords[0][1];
  let maxLat = coords[0][1];
  let minLng = coords[0][0];
  let maxLng = coords[0][0];
  for (const [lng, lat] of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return [minLat, minLng, maxLat, maxLng];
}

function projectMapCenter(mapData: ProjectMapData): { lat: number; lng: number } {
  const b = mapData.boundary;
  if (b.type === "circle") return b.center;
  const coords = b.coordinates;
  if (!coords.length) return { lat: 50.8, lng: -1.09 };
  const sum = coords.reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]);
  return { lat: sum[1] / coords.length, lng: sum[0] / coords.length };
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const preferences = usePreferences();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [mapData, setMapData] = useState<ProjectMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  // Street list state
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  // Sync activeFilter with user preference once loaded
  const prefStreetFilter = preferences?.preferences?.defaultStreetFilter;
  useEffect(() => {
    if (prefStreetFilter && prefStreetFilter !== "all") {
      setActiveFilter(prefStreetFilter as FilterStatus);
    }
  }, [prefStreetFilter]);

  // Map highlight state
  const [highlightOsmIds, setHighlightOsmIds] = useState<string[]>([]);
  const [streetHighlightBbox, setStreetHighlightBbox] = useState<
    [number, number, number, number] | null
  >(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [projectRes, mapRes] = await Promise.all([
        projectsService.getById(id, { includeStreets: true }),
        projectsService.getMap(id),
      ]);
      setProject(projectRes.project);
      setMapData(mapRes.map);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleArchive = async () => {
    if (!id) return;
    if (!window.confirm("Archive this project? It will be hidden from your list.")) return;
    setArchiving(true);
    try {
      await projectsService.delete(id);
      navigate(ROUTES.PROJECTS_LIST);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to archive project");
      setArchiving(false);
    }
  };

  // Group streets by name for display
  const groupedStreets = useMemo(() => {
    if (!mapData?.streets) return [];
    return groupProjectMapStreetsByName(mapData.streets);
  }, [mapData?.streets]);

  // Compute counts for each filter bin
  const binCounts = useMemo(() => {
    const counts = { completed: 0, almostThere: 0, inProgress: 0, notStarted: 0 };
    for (const street of groupedStreets) {
      const bin = getStreetBin(street.percentage, street.completed);
      counts[bin]++;
    }
    return counts;
  }, [groupedStreets]);

  // Filter streets by search and active filter
  const filteredStreets = useMemo(() => {
    let result = groupedStreets;

    // Apply status filter
    if (activeFilter !== "all") {
      result = result.filter((s) => getStreetBin(s.percentage, s.completed) === activeFilter);
    }

    // Apply search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }

    return result;
  }, [groupedStreets, activeFilter, search]);

  // Handle street hover/click to highlight on map
  const handleStreetHighlight = useCallback(
    (streetData: StreetListItemData) => {
      if (!mapData?.streets) return;
      const osmIdSet = new Set(streetData.osmIds.map((id) => normalizeOsmId(id)));
      const matching = mapData.streets.filter((s) => osmIdSet.has(normalizeOsmId(s.osmId)));
      if (matching.length === 0) return;
      setStreetHighlightBbox(computeBboxFromStreets(matching));
      setHighlightOsmIds(matching.map((s) => s.osmId));
    },
    [mapData?.streets]
  );

  const handleStreetClear = useCallback(() => {
    setHighlightOsmIds([]);
    setStreetHighlightBbox(null);
  }, []);

  if (!id) {
    return (
      <div className="p-4">
        <p className="text-danger">Missing project ID</p>
        <Link to={ROUTES.PROJECTS_LIST}>Back to projects</Link>
      </div>
    );
  }

  if (loading && !project) {
    return (
      <div className="p-4">
        <p className="text-text-muted">Loading project…</p>
      </div>
    );
  }

  if (error && !project) {
    return (
      <Card className="m-4 max-w-md">
        <p className="text-danger">{error}</p>
        <Button variant="secondary" onClick={fetchData} className="mt-2">
          Retry
        </Button>
        <Link to={ROUTES.PROJECTS_LIST} className="mt-3 block">
          Back to projects
        </Link>
      </Card>
    );
  }

  if (!project || !mapData) return null;

  const center = projectMapCenter(mapData);
  const boundaryBbox = computeBoundaryBbox(mapData.boundary);

  const highlightFocus =
    streetHighlightBbox !== null
      ? { bbox: streetHighlightBbox }
      : boundaryBbox !== null
        ? { bbox: boundaryBbox }
        : null;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to={ROUTES.PROJECTS_LIST} className="text-sm text-text-muted hover:underline">
            ← Projects
          </Link>
          <h1 className="text-xl font-bold text-text">{project.name}</h1>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={handleArchive}
          disabled={archiving}
          className="min-h-[44px]"
        >
          {archiving ? "Archiving…" : "Archive"}
        </Button>
      </header>

      {/* Main content: Map + Sidebar */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Map */}
        <div className="min-h-[40vh] flex-1 md:min-h-0">
          <UnifiedMap
            center={center}
            zoom={MAP_ZOOM.PROJECT_DETAIL}
            streets={mapData.streets}
            defaultVisibleStatuses={new Set(["completed", "partial", "not_started"])}
            availableStatuses={["completed", "partial", "not_started"]}
            boundary={mapData.boundary}
            showBoundaryOutline
            highlightFocus={highlightFocus}
            highlightOsmIds={highlightOsmIds}
            showLegend
            className="h-full w-full"
          />
        </div>

        {/* Sidebar */}
        <aside className="flex w-full shrink-0 flex-col border-border bg-surface md:w-[380px] md:border-l-2">
          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            {/* Progress summary */}
            <div className="text-sm text-text-muted">
              {mapData.stats.completedStreetNames ?? mapData.stats.completedStreets} of{" "}
              {project.totalStreetNames ?? project.totalStreets} streets completed ·{" "}
              {Math.round(project.progress)}%
            </div>

            {/* Streets tab */}
            <details className="group">
              <summary className="flex min-h-[44px] cursor-pointer items-center rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted hover:bg-border/30">
                Streets ({groupedStreets.length})
              </summary>
              <div className="mt-2 flex flex-col gap-3">
                {/* Filter pills */}
                <div className="flex gap-1.5" role="group" aria-label="Filter streets">
                  {/* Only show "All" if it's active OR if we have any bin counts */}
                  {(activeFilter === "all" || Object.values(binCounts).some(c => c > 0)) && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter("all")}
                      className={`flex-[0.95] rounded-full border px-1.5 py-1 text-xs font-medium transition-all ${
                        activeFilter === "all"
                          ? "border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30"
                          : "border-border bg-surface text-text-muted hover:bg-border/50 hover:border-text-muted"
                      }`}
                    >
                      All
                    </button>
                  )}
                  {FILTER_PILLS.map(({ key, label, dotColor }) => {
                    const count = binCounts[key];
                    const isActive = activeFilter === key;
                    // Always show the active filter pill, hide others with count === 0
                    if (count === 0 && !isActive) return null;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveFilter(key)}
                        className={`flex-[0.95] inline-flex items-center justify-center gap-1 rounded-full border px-1.5 py-1 text-xs font-medium transition-all ${
                          isActive
                            ? "border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30"
                            : "border-border bg-surface text-text-muted hover:bg-border/50 hover:border-text-muted"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} aria-hidden />
                        {count > 0 ? count : label}
                      </button>
                    );
                  })}
                </div>

                {/* Search */}
                <input
                  type="search"
                  placeholder="Search streets…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded border-2 border-border bg-surface px-3 py-2 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Search streets"
                />

                {/* Street list */}
                <div className="max-h-[50vh] overflow-y-auto rounded border-2 border-border">
                  {filteredStreets.length === 0 ? (
                    <p className="p-4 text-center text-sm text-text-muted">
                      {search.trim() ? "No streets match your search." : "No streets in this category."}
                    </p>
                  ) : (
                    <ul className="list-none divide-y divide-border p-0">
                      {filteredStreets.map((street) => (
                        <StreetListItem
                          key={street.name}
                          street={{
                            name: street.name,
                            osmIds: street.osmIds,
                            percentage: street.percentage,
                          }}
                          onHighlight={handleStreetHighlight}
                          onClearHighlight={handleStreetClear}
                          variant="homepage"
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </details>

            {/* Milestones */}
            <MilestonesSection projectId={project.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}
