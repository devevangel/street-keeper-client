/**
 * Returning User Homepage
 * Two-column layout: map on left, projects sidebar on right.
 * Shows top project (most ran streets) and up to 3 ongoing projects.
 * Collapsible streets list sorted by almost completed.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { DynamicHero } from "./DynamicHero";
import { SuggestionCard } from "./SuggestionCard";
import { UniversalSearchInput } from "../projects/UniversalSearchInput";
import { MapView, type MapViewHighlightFocus } from "../map";
import { useAnalytics } from "../../contexts/AnalyticsContext";
import { activitiesService } from "../../services/activities.service";
import { projectsService } from "../../services/projects.service";
import { invalidateHomepageCache } from "../../services/homepage.service";
import { ROUTES } from "../../config/constants";
import type { HomepagePayload } from "../../services/homepage.service";
import type { MapStreet } from "../../types/api.types";
import type { ProjectListItem, SnapshotStreet } from "../../types/api.types";
import type { GeocodingResult } from "../../types/api.types";

interface ReturningUserHomepageProps {
  data: HomepagePayload;
  isLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  streets: MapStreet[];
  onViewportChange: (center: { lat: number; lng: number }) => void;
  onRefetch: () => Promise<void>;
  onSearchSelect: (result: GeocodingResult) => void;
}

export function ReturningUserHomepage({
  data,
  isLoading,
  userLocation,
  streets,
  onViewportChange,
  onRefetch,
  onSearchSelect,
}: ReturningUserHomepageProps) {
  const { track } = useAnalytics();
  const navigate = useNavigate();
  const [highlightFocus, setHighlightFocus] =
    useState<MapViewHighlightFocus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    synced: number;
    error?: string;
  } | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectStreets, setProjectStreets] = useState<SnapshotStreet[]>([]);
  const [streetsLoading, setStreetsLoading] = useState(false);
  const [showStreetsList, setShowStreetsList] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Fetch projects on mount
  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);
    projectsService
      .getAll()
      .then((res) => {
        if (cancelled) return;
        const activeProjects = res.projects.filter((p) => !p.isArchived);
        // Sort by completedStreetNames (most ran streets) descending
        activeProjects.sort((a, b) => {
          const aCompleted = a.completedStreetNames ?? a.completedStreets;
          const bCompleted = b.completedStreetNames ?? b.completedStreets;
          return bCompleted - aCompleted;
        });
        // Take top 4 (1 top + 3 ongoing)
        setProjects(activeProjects.slice(0, 4));
        // Auto-select top project
        if (activeProjects.length > 0) {
          setSelectedProjectId(activeProjects[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch streets when project is selected
  useEffect(() => {
    if (!selectedProjectId) {
      setProjectStreets([]);
      return;
    }
    let cancelled = false;
    setStreetsLoading(true);
    projectsService
      .getById(selectedProjectId, { includeStreets: true })
      .then((res) => {
        if (cancelled) return;
        const streets = res.project.streets || [];
        // Sort by almost completed (high percentage, not completed) - show best opportunities first
        streets.sort((a, b) => {
          // Completed streets go to bottom
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;
          // Among incomplete, sort by percentage descending (almost done first)
          return b.percentage - a.percentage;
        });
        setProjectStreets(streets);
      })
      .catch(() => {
        if (!cancelled) setProjectStreets([]);
      })
      .finally(() => {
        if (!cancelled) setStreetsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  const handleShowOnMap = useCallback(() => {
    if (data.primarySuggestion?.focus) {
      setHighlightFocus({
        bbox: data.primarySuggestion.focus.bbox,
        streetIds: data.primarySuggestion.focus.streetIds,
        startPoint: data.primarySuggestion.focus.startPoint,
      });
      mapRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [data.primarySuggestion?.focus]);

  const handleStreetClick = useCallback(
    (street: SnapshotStreet) => {
      // Find the street in map streets and highlight it
      const mapStreet = streets.find((s) => s.osmId === street.osmId);
      if (mapStreet && mapStreet.geometry?.coordinates) {
        const coords = mapStreet.geometry.coordinates;
        const lats = coords.map((c) => c[1]);
        const lngs = coords.map((c) => c[0]);
        const bbox: [number, number, number, number] = [
          Math.min(...lats),
          Math.min(...lngs),
          Math.max(...lats),
          Math.max(...lngs),
        ];
        // Extract way ID from osmId (e.g., "way/12345" -> 12345)
        const wayId = parseInt(street.osmId.replace("way/", ""), 10);
        setHighlightFocus({
          bbox,
          streetIds: [wayId],
          startPoint: coords[0] ? { lat: coords[0][1], lng: coords[0][0] } : undefined,
        });
        mapRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        // If street not in current map view, try to center on project location
        const project = projects.find((p) => p.id === selectedProjectId);
        if (project) {
          const bbox: [number, number, number, number] = [
            project.centerLat - 0.001,
            project.centerLng - 0.001,
            project.centerLat + 0.001,
            project.centerLng + 0.001,
          ];
          const wayId = parseInt(street.osmId.replace("way/", ""), 10);
          setHighlightFocus({
            bbox,
            streetIds: [wayId],
            startPoint: { lat: project.centerLat, lng: project.centerLng },
          });
          mapRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    },
    [streets, projects, selectedProjectId]
  );

  const handleSync = useCallback(async () => {
    track("sync_clicked", {});
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await activitiesService.syncFromStrava();
      setSyncResult({ synced: result.synced + result.processed });
      invalidateHomepageCache();
      await onRefetch();
    } catch (err) {
      setSyncResult({
        synced: 0,
        error: err instanceof Error ? err.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
    }
  }, [track, onRefetch]);

  const topProject = projects[0];
  const ongoingProjects = projects.slice(1, 4);

  return (
    <>
      {/* Mobile: Hero and suggestion on top */}
      <div className="block space-y-4 md:hidden">
        <DynamicHero hero={data.hero} isLoading={isLoading} />
        {data.primarySuggestion && (
          <SuggestionCard
            suggestion={data.primarySuggestion}
            isLoading={isLoading}
            onShowOnMap={handleShowOnMap}
            onTrack={(action: "show_on_map" | "view_milestones") => {
              track("primary_action_clicked", { action });
              if (action === "show_on_map" && data.primarySuggestion) {
                track("suggestion_opened", {
                  type: data.primarySuggestion.type,
                  cooldownKey: data.primarySuggestion.cooldownKey,
                  context: data.mapContext?.projectId ? "project" : "area",
                  projectId: data.mapContext?.projectId ?? undefined,
                });
              }
            }}
          />
        )}
      </div>

      {/* Two-column layout: map left, sidebar right */}
      <div className="-mx-4 w-[calc(100%+2rem)] flex min-h-0 flex-1 flex-col md:mx-0 md:w-full md:flex-row">
        {/* Map section - left side */}
        <div className="order-1 min-h-[40vh] w-full flex-1 md:order-1 md:h-auto md:min-h-[calc(100vh-120px)]">
          <div ref={mapRef} className="h-[40vh] w-full md:h-full">
            <MapView
              mapCenter={userLocation}
              userLocation={userLocation}
              streets={streets}
              onViewportChange={onViewportChange}
              highlightFocus={highlightFocus}
              className="h-full w-full"
            />
          </div>
        </div>

        {/* Sidebar - right side */}
        <aside className="order-2 w-full shrink-0 border-border bg-surface md:order-2 md:h-auto md:min-h-[calc(100vh-120px)] md:w-[380px] md:overflow-y-auto md:border-l-2">
          <div className="flex flex-col gap-4 p-4 md:p-6">
            {/* Search bar */}
            <div>
              <UniversalSearchInput
                placeholder="Search area…"
                onSelect={onSearchSelect}
              />
            </div>

            {/* Sync button */}
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="w-full"
              >
                {syncing ? "Syncing…" : "Sync from Strava"}
              </Button>
              {syncResult && (
                <span
                  className={`text-sm ${syncResult.error ? "text-red-500" : "text-success"}`}
                >
                  {syncResult.error ??
                    (syncResult.synced > 0
                      ? `Synced ${syncResult.synced} activit${syncResult.synced !== 1 ? "ies" : "y"}`
                      : "No new activities")}
                </span>
              )}
            </div>

            {/* Desktop: Hero and suggestion */}
            <div className="hidden space-y-4 md:block">
              <DynamicHero hero={data.hero} isLoading={isLoading} />
              {data.primarySuggestion && (
                <SuggestionCard
                  suggestion={data.primarySuggestion}
                  isLoading={isLoading}
                  onShowOnMap={handleShowOnMap}
                  onTrack={(action: "show_on_map" | "view_milestones") => {
                    track("primary_action_clicked", { action });
                    if (action === "show_on_map" && data.primarySuggestion) {
                      track("suggestion_opened", {
                        type: data.primarySuggestion.type,
                        cooldownKey: data.primarySuggestion.cooldownKey,
                        context: data.mapContext?.projectId ? "project" : "area",
                        projectId: data.mapContext?.projectId ?? undefined,
                      });
                    }
                  }}
                />
              )}
            </div>

            {/* Top Project */}
            {projectsLoading ? (
              <Card padding="sm">
                <p className="text-text-muted text-sm">Loading projects…</p>
              </Card>
            ) : topProject ? (
              <Card padding="sm" className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text">Top Project</h3>
                    <button
                      type="button"
                      onClick={() => navigate(`${ROUTES.PROJECTS_LIST}/${topProject.id}`)}
                      className="text-left text-sm font-medium text-accent hover:underline"
                    >
                      {topProject.name}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProjectId(
                        selectedProjectId === topProject.id ? null : topProject.id
                      )
                    }
                    className="text-text-muted text-xs hover:text-text"
                  >
                    {selectedProjectId === topProject.id ? "−" : "+"}
                  </button>
                </div>
                <div className="text-sm text-text-muted">
                  {topProject.completedStreetNames ?? topProject.completedStreets} /{" "}
                  {topProject.totalStreetNames ?? topProject.totalStreets} streets ·{" "}
                  {Math.round(topProject.progress)}%
                </div>
              </Card>
            ) : null}

            {/* Ongoing Projects */}
            {ongoingProjects.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-text">Ongoing Projects</h3>
                {ongoingProjects.map((project) => (
                  <Card
                    key={project.id}
                    padding="sm"
                    className="cursor-pointer space-y-1 hover:bg-border/10"
                    onClick={() => navigate(`${ROUTES.PROJECTS_LIST}/${project.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text">{project.name}</p>
                        <p className="text-xs text-text-muted">
                          {project.completedStreetNames ?? project.completedStreets} /{" "}
                          {project.totalStreetNames ?? project.totalStreets} streets ·{" "}
                          {Math.round(project.progress)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Streets List (collapsible) */}
            {selectedProjectId && (
              <details
                open={showStreetsList}
                onToggle={(e) => setShowStreetsList(e.currentTarget.open)}
                className="space-y-2"
              >
                <summary className="cursor-pointer rounded border-2 border-border bg-surface px-3 py-2 text-sm font-bold uppercase tracking-wide text-text-muted min-h-[44px] flex items-center hover:text-text">
                  Streets ({projectStreets.filter((s) => !s.completed).length} incomplete)
                </summary>
                {showStreetsList && (
                  <Card padding="sm" className="mt-1 max-h-[40vh] space-y-1 overflow-y-auto">
                    {streetsLoading ? (
                      <p className="text-text-muted text-sm">Loading streets…</p>
                    ) : projectStreets.length === 0 ? (
                      <p className="text-text-muted text-sm">No streets found</p>
                    ) : (
                      <ul className="list-none divide-y divide-border space-y-0 p-0">
                        {projectStreets
                          .filter((s) => !s.completed)
                          .map((street) => (
                            <li
                              key={street.osmId}
                              className="cursor-pointer px-3 py-2 text-sm hover:bg-border/10 even:bg-border/5"
                              onClick={() => handleStreetClick(street)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-text">{street.name}</span>
                                <span className="text-text-muted">
                                  {Math.round(street.percentage)}%
                                </span>
                              </div>
                            </li>
                          ))}
                        {projectStreets.filter((s) => !s.completed).length === 0 && (
                          <li className="px-3 py-2 text-sm text-text-muted">
                            All streets completed!
                          </li>
                        )}
                      </ul>
                    )}
                  </Card>
                )}
              </details>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
