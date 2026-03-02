/**
 * ProjectDetailPage
 * Simplified project view: left side map, right side street list with filters.
 * Streets grouped by name with clickable filter pills and map highlighting.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button, Card, Input, StreetListItem, type StreetListItemData } from "../components/common";
import { UnifiedMap } from "../components/map";
import { MAP_ZOOM } from "../components/map/mapConstants";
import { MilestonesSection } from "../components/milestones/MilestonesSection";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { ROUTES } from "../config/constants";
import type { ProjectDetail, ProjectMapData } from "../types/api.types";
import { groupProjectMapStreetsByName } from "../utils/group-streets-by-name";
import {
  normalizeOsmId,
  computeBboxFromStreets,
  computeBoundaryBbox,
  projectMapCenter,
} from "../utils/map-utils";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [mapData, setMapData] = useState<ProjectMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  // Street list state
  const [search, setSearch] = useState("");

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

  // Filter streets by search only (map legend handles status filtering)
  const filteredStreets = useMemo(() => {
    let result = groupedStreets;

    // Apply search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }

    return result;
  }, [groupedStreets, search]);

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
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to={ROUTES.PROJECTS_LIST} className="text-sm text-text-muted hover:underline">
            ← Projects
          </Link>
          <h1 className="text-xl font-bold text-text">{project.name}</h1>
        </div>
        <Button
          variant="danger"
          onClick={handleArchive}
          disabled={archiving}
        >
          {archiving ? "Archiving…" : "Archive project"}
        </Button>
      </header>

      {/* Main content: Map + Sidebar */}
      <div className="flex flex-col md:min-h-0 md:flex-1 md:flex-row">
        {/* Map */}
        <div className="h-[50vh] w-full md:h-full md:min-h-0 md:flex-1">
          <UnifiedMap
            center={center}
            zoom={MAP_ZOOM.PROJECT_DETAIL}
            streets={mapData.streets}
            boundary={mapData.boundary}
            showBoundaryOutline
            highlightFocus={highlightFocus}
            highlightOsmIds={highlightOsmIds}
            showLegend
            className="h-full w-full"
          />
        </div>

        {/* Sidebar */}
        <aside className="w-full border-border bg-surface md:flex md:h-full md:w-[380px] md:shrink-0 md:flex-col md:border-l">
          {/* Fixed progress summary */}
          <div className="border-b border-border p-4">
            <div className="text-sm text-text-muted">
              {mapData.stats.completedStreetNames ?? mapData.stats.completedStreets} of{" "}
              {project.totalStreetNames ?? project.totalStreets} streets completed ·{" "}
              {Math.round(project.progress)}%
            </div>
          </div>

          {/* Scrollable content */}
          <div className="p-4 md:flex-1 md:overflow-y-auto">
            {/* Streets section */}
            <div className="space-y-4">
              {/* Search */}
              <Input
                type="search"
                placeholder="Search streets…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search streets"
              />

              {/* Street list */}
              <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-border">
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

              {/* Milestones */}
              <MilestonesSection projectId={project.id} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
