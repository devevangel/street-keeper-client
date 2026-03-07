/**
 * ProjectDetailPage
 * Simplified project view: left side map, right side street list with filters.
 * Streets grouped by name with clickable filter pills and map highlighting.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button, Card, ConfirmModal, Input, StreetListItem, ProgressLoader, ProgressRing, Skeleton, SkeletonStreetRow, type StreetListItemData } from "../components/common";
import { UnifiedMap } from "../components/map";
import { MAP_ZOOM } from "../components/map/mapConstants";
import { QuickStatsCard } from "../components/project/QuickStatsCard";
import { QuickWinsSection } from "../components/project/QuickWinsSection";
import { MilestonesSection } from "../components/milestones/MilestonesSection";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { ROUTES } from "../config/constants";
import { useToast } from "../contexts/ToastContext";
import type { ProjectDetail, ProjectMapData } from "../types/api.types";
import { groupProjectMapStreetsByName } from "../utils/group-streets-by-name";
import { normalizeStreetName } from "../utils/normalize-street-name";
import {
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
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const toast = useToast();

  // Street list state
  const [search, setSearch] = useState("");

  // Map highlight state
  const [highlightOsmIds, setHighlightOsmIds] = useState<string[]>([]);
  const [streetHighlightBbox, setStreetHighlightBbox] = useState<
    [number, number, number, number] | null
  >(null);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [projectRes, mapRes] = await Promise.all([
        projectsService.getById(id, { includeStreets: true }),
        projectsService.getMap(id),
      ]);
      if (signal?.aborted) return;
      setProject(projectRes.project);
      setMapData(mapRes.map);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof ApiError ? err.message : "Failed to load project");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const doArchive = useCallback(async () => {
    if (!id) return;
    setArchiving(true);
    try {
      await projectsService.archive(id);
      toast?.showToast("Project archived", "success");
      navigate(ROUTES.PROJECTS_LIST);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to archive project";
      setError(msg);
      toast?.showToast(msg, "error");
      setArchiving(false);
    }
  }, [id, navigate, toast]);

  const doRestore = useCallback(async () => {
    if (!id) return;
    setRestoring(true);
    try {
      await projectsService.restore(id);
      toast?.showToast("Project restored", "success");
      await fetchData();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to restore project";
      toast?.showToast(msg, "error");
    } finally {
      setRestoring(false);
    }
  }, [id, fetchData, toast]);

  const doDelete = useCallback(async () => {
    if (!id) return;
    try {
      await projectsService.deletePermanently(id);
      toast?.showToast("Project permanently deleted", "success");
      navigate(ROUTES.PROJECTS_LIST);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete project";
      toast?.showToast(msg, "error");
    }
  }, [id, navigate, toast]);

  const [expanding, setExpanding] = useState(false);
  
  const doExpand = useCallback(async () => {
    if (!id) return;
    setExpanding(true);
    try {
      const result = await projectsService.expandStreets(id);
      toast?.showToast(result.message, result.addedSegments > 0 ? "success" : "info");
      if (result.addedSegments > 0) {
        await fetchData();
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to expand streets";
      toast?.showToast(msg, "error");
    } finally {
      setExpanding(false);
    }
  }, [id, fetchData, toast]);

  const handleArchiveClick = () => setArchiveConfirmOpen(true);
  const handleDeleteClick = () => setDeleteConfirmOpen(true);

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
  // Find ALL segments with matching normalized name from mapData.streets
  // This uses the exact same approach as completion coloring - iterate through all streets
  const handleStreetHighlight = useCallback(
    (streetData: StreetListItemData) => {
      if (!mapData?.streets?.length) return;
      
      // Find ALL streets in mapData.streets that have the same normalized name
      // This is the same logic used for completion coloring - each segment is checked individually
      const targetName = normalizeStreetName(streetData.name);
      const allMatchingStreets = mapData.streets.filter(
        (s) => normalizeStreetName(s.name || "Unnamed") === targetName
      );
      
      if (allMatchingStreets.length === 0) return;
      
      // Use ALL matching osmIds for highlighting
      const allOsmIds = allMatchingStreets.map((s) => s.osmId);
      setHighlightOsmIds(allOsmIds);
      setStreetHighlightBbox(computeBboxFromStreets(allMatchingStreets));
    },
    [mapData?.streets]
  );

  const handleStreetClear = useCallback(() => {
    setHighlightOsmIds([]);
    setStreetHighlightBbox(null);
  }, []);

  const handleQuickWinShowOnMap = useCallback(
    (osmId: string) => {
      const street = mapData?.streets?.find((s) => s.osmId === osmId);
      if (!street) return;
      setHighlightOsmIds([osmId]);
      setStreetHighlightBbox(computeBboxFromStreets([street]));
    },
    [mapData?.streets]
  );

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
      <div className="flex h-full flex-col overflow-hidden">
        {/* Skeleton header */}
        <header className="flex shrink-0 items-center gap-4 border-b border-border bg-surface px-4 py-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-48" />
        </header>
        {/* Skeleton content */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="relative h-[45vh] w-full shrink-0 md:h-full md:flex-1">
            <ProgressLoader type="project" overlay />
          </div>
          <aside className="flex min-h-0 flex-1 flex-col border-border bg-surface md:w-[380px] md:flex-none md:border-l">
            <div className="border-b border-border p-4">
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="p-4">
              <Skeleton className="mb-4 h-10 w-full rounded-lg" />
              <div className="rounded-lg border border-border">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonStreetRow key={i} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <Card className="m-4 max-w-md">
        <p className="text-danger">{error}</p>
        <Button variant="secondary" onClick={() => void fetchData()} className="mt-2">
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
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to={ROUTES.PROJECTS_LIST} className="text-sm text-text-muted hover:underline">
            ← Projects
          </Link>
          <h1 className="text-xl font-bold text-text">{project.name}</h1>
          {project.isArchived && (
            <span className="rounded bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
              Archived
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {project.isArchived ? (
            <>
              <Button
                variant="secondary"
                onClick={doRestore}
                disabled={restoring}
              >
                {restoring ? "Restoring…" : "Restore project"}
              </Button>
              <Button variant="danger" onClick={handleDeleteClick}>
                Delete permanently
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={doExpand}
                disabled={expanding}
                title="Find additional street segments outside the boundary"
              >
                {expanding ? "Expanding…" : "Expand streets"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleArchiveClick}
                disabled={archiving}
              >
                {archiving ? "Archiving…" : "Archive"}
              </Button>
              <Button variant="danger" onClick={handleDeleteClick}>
                Delete
              </Button>
            </>
          )}
        </div>
      </header>

      <ConfirmModal
        isOpen={archiveConfirmOpen}
        onClose={() => setArchiveConfirmOpen(false)}
        title="Archive project?"
        message="It will be hidden from your list. You can view or restore it later from your projects list."
        confirmLabel="Archive"
        variant="danger"
        onConfirm={doArchive}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Permanently delete project?"
        message="This action cannot be undone. All project data, including progress and milestones, will be permanently deleted. Your activity data (runs) will NOT be affected."
        confirmLabel="Delete permanently"
        variant="danger"
        onConfirm={doDelete}
      />

      {/* Main content: Map + Sidebar */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Map */}
        <div className="h-[45vh] w-full shrink-0 md:h-full md:min-h-0 md:flex-1 md:shrink">
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
        <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto border-border bg-surface md:w-[380px] md:flex-none md:border-l">
          {/* Scrollable content */}
          <div className="space-y-4 p-4 pb-8 md:min-h-0 md:flex-1 md:overflow-y-auto md:pb-4">
            {/* Your progress (ring) */}
            <Card padding="md">
              <h3 className="text-sm font-semibold text-text-muted mb-2">Your progress</h3>
              <ProgressRing value={Math.round(project.progress)} animated size={72} strokeWidth={8}>
                <div>
                  <p className="text-base font-bold text-text">
                    {mapData.stats.completedStreetNames ?? mapData.stats.completedStreets} streets conquered!
                  </p>
                  <p className="text-sm text-text-muted">
                    {Math.round(project.progress)}% complete
                  </p>
                </div>
              </ProgressRing>
            </Card>

            {/* Quick stats */}
            {mapData.projectStats && (
              <QuickStatsCard stats={mapData.projectStats} />
            )}

            {/* Quick wins */}
            {mapData.quickWins && mapData.quickWins.length > 0 && (
              <QuickWinsSection
                quickWins={mapData.quickWins}
                onShowOnMap={handleQuickWinShowOnMap}
              />
            )}

            {/* Streets section */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-text">All streets</h3>
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
                          segmentCount: street.segmentCount,
                          completed: street.completed,
                          runCount: street.runCount,
                          lastRunDate: street.lastRunDate,
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
