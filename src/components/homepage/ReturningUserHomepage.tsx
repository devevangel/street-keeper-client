/**
 * Returning User Homepage
 * Two-column layout: map on left, data panel on right.
 * Panel shows: greeting, suggested run, last run, street stats, alternates.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  UnifiedMap,
  MAP_ZOOM,
  MapLegendFilterBins,
  LocationAccessBanner,
} from "../map";
import { getStreetBin, type FilterStatus } from "../../utils/street-filters";
import { usePreferences } from "../../contexts/PreferencesContext";
import { LastRunCard } from "./LastRunCard";
import { NextRunCard } from "./NextRunCard";
import { Skeleton } from "../common";
import type { HomepagePayload, HomepageSuggestion } from "../../services/homepage.service";
import type { MapStreet, GpsTrace } from "../../types/api.types";

const DEFAULT_MAP_CENTER = { lat: 50.8, lng: -1.09 };
const EMPTY_HIGHLIGHT_OSM_IDS: string[] = [];

interface ReturningUserHomepageProps {
  userLocation: { lat: number; lng: number } | null;
  mapCenter: { lat: number; lng: number } | null;
  streets: MapStreet[];
  gpsTraces?: GpsTrace[];
  onViewportChange: (center: { lat: number; lng: number }) => void;
  showLocationAccessBanner?: boolean;
  locationErrorMessage?: string;
  onRetryLocation?: () => void;
  homepage: HomepagePayload | null;
  homepageLoading: boolean;
}

function PanelSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  );
}

function AlternatesList({
  alternates,
  onShowOnMap,
}: {
  alternates: HomepageSuggestion[];
  onShowOnMap: (s: HomepageSuggestion) => void;
}) {
  if (alternates.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Other ideas
      </h3>
      <div className="space-y-2">
        {alternates.map((alt) => (
          <button
            key={alt.cooldownKey}
            type="button"
            onClick={() => onShowOnMap(alt)}
            className="group flex w-full items-center gap-3 rounded-lg border-2 border-border bg-surface p-3 text-left transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-text">{alt.title}</p>
              <p className="mt-0.5 text-xs text-text-muted">{alt.shortCopy}</p>
            </div>
            <span className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5">
              &rarr;
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StreetStats({ streets }: { streets: MapStreet[] }) {
  const counts = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    for (const s of streets) {
      if (s.status === "completed") completed++;
      else if ((s.percentage ?? 0) > 0) inProgress++;
      else notStarted++;
    }
    return { completed, inProgress, notStarted, total: streets.length };
  }, [streets]);

  if (counts.total === 0) return null;

  const pct = Math.round((counts.completed / counts.total) * 100);
  const inProgressPct = Math.round((counts.inProgress / counts.total) * 100);

  return (
    <div className="rounded-lg border-2 border-border bg-surface p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Streets nearby
      </h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-text">{pct}%</span>
        <span className="text-sm text-text-muted">
          completed ({counts.completed}/{counts.total})
        </span>
      </div>
      <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-border/20">
        <div
          className="bg-success transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
        <div
          className="bg-warning transition-[width] duration-500"
          style={{ width: `${inProgressPct}%` }}
        />
      </div>
      <div className="mt-1.5 flex gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-success" />
          {counts.completed} done
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-warning" />
          {counts.inProgress} in progress
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-border/40" />
          {counts.notStarted} to go
        </span>
      </div>
    </div>
  );
}

export function ReturningUserHomepage({
  userLocation,
  mapCenter,
  streets,
  gpsTraces = [],
  onViewportChange,
  showLocationAccessBanner = false,
  locationErrorMessage,
  onRetryLocation,
  homepage,
  homepageLoading,
}: ReturningUserHomepageProps) {
  const preferences = usePreferences();
  const [visibleBins, setVisibleBins] = useState<Set<FilterStatus>>(
    () => new Set(["completed", "almostThere", "inProgress", "notStarted"])
  );
  const mapRef = useRef<HTMLDivElement>(null);

  const prefStreetFilter = preferences?.preferences?.defaultStreetFilter;
  useEffect(() => {
    if (prefStreetFilter && prefStreetFilter !== "all") {
      setVisibleBins(new Set([prefStreetFilter as FilterStatus]));
    }
  }, [prefStreetFilter]);

  const effectiveMapCenter = useMemo(
    () => mapCenter ?? userLocation,
    [mapCenter?.lat, mapCenter?.lng, userLocation?.lat, userLocation?.lng]
  );

  const mapZoom = useMemo(
    () =>
      userLocation
        ? MAP_ZOOM.USER_LOCATION
        : (preferences?.preferences?.defaultMapZoom ?? MAP_ZOOM.DEFAULT),
    [userLocation, preferences?.preferences?.defaultMapZoom]
  );

  const binCounts = useMemo(() => {
    const counts = { completed: 0, almostThere: 0, inProgress: 0, notStarted: 0 };
    for (const s of streets) {
      const completed = s.status === "completed";
      const bin = getStreetBin(s.percentage ?? 0, completed);
      if (bin !== "all") counts[bin]++;
    }
    return counts;
  }, [streets]);

  const filteredStreetsForMap = useMemo(() => {
    if (!streets.length) return streets;
    return streets.filter((s) => {
      const completed = s.status === "completed";
      const bin = getStreetBin(s.percentage ?? 0, completed);
      return visibleBins.has(bin);
    });
  }, [streets, visibleBins]);

  const handleShowOnMap = useCallback(() => {
    // TODO: pan/zoom map to suggestion focus area
  }, []);

  const handleShowAlternateOnMap = useCallback((_suggestion: HomepageSuggestion) => {
    // TODO: pan/zoom map to alternate suggestion focus area
  }, []);

  const greeting = homepage?.userName
    ? homepage.userState === "brand_new" || homepage.userState === "syncing"
      ? `Welcome, ${homepage.userName}`
      : `Hey, ${homepage.userName}`
    : null;

  return (
    <div className="flex h-full flex-col overflow-hidden md:flex-row">
      {/* Map */}
      <div className="h-[45vh] w-full shrink-0 md:h-full md:min-h-0 md:flex-1 md:shrink">
        <div ref={mapRef} className="relative h-full w-full">
          <UnifiedMap
            center={effectiveMapCenter ?? DEFAULT_MAP_CENTER}
            zoom={mapZoom}
            userLocation={userLocation}
            showUserLocationMarker
            streets={filteredStreetsForMap}
            gpsTraces={gpsTraces}
            onViewportChange={onViewportChange}
            highlightFocus={null}
            highlightOsmIds={EMPTY_HIGHLIGHT_OSM_IDS}
            showLegend={false}
            showLegendGuide={false}
            className="h-full w-full"
            isLoading={false}
          />
          {streets.length > 0 && (
            <MapLegendFilterBins
              visibleBins={visibleBins}
              onToggle={(bin) => {
                setVisibleBins((prev) => {
                  const next = new Set(prev);
                  if (next.has(bin)) next.delete(bin);
                  else next.add(bin);
                  return next;
                });
              }}
              counts={binCounts}
              onShowAll={() => {
                setVisibleBins(
                  new Set(["completed", "almostThere", "inProgress", "notStarted"])
                );
              }}
            />
          )}
        </div>
      </div>

      {/* Side panel */}
      <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto border-border bg-bg md:w-[380px] md:flex-none md:border-l-2">
        {showLocationAccessBanner && locationErrorMessage && onRetryLocation && (
          <div className="border-b-2 border-border p-5">
            <LocationAccessBanner error={locationErrorMessage} onRetry={onRetryLocation} />
          </div>
        )}

        {homepageLoading && !homepage ? (
          <PanelSkeleton />
        ) : (
          <div className="flex flex-col gap-5 p-5">
            {/* Greeting */}
            {greeting && (
              <p className="text-xl font-bold text-text">{greeting}</p>
            )}

            {/* ── brand_new ── */}
            {homepage?.userState === "brand_new" && (
              <>
                {(homepage.primarySuggestion || homepage.firstStreet) ? (
                  <NextRunCard data={homepage} onShowOnMap={handleShowOnMap} />
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-border bg-surface p-5 text-center">
                    <p className="text-sm text-text-muted">
                      Connect Strava to import your runs, or head out and explore.
                    </p>
                  </div>
                )}
                {homepage.firstStreet && (
                  <Link
                    to="/projects/new"
                    className="inline-flex w-full items-center justify-center rounded-lg border-2 border-border bg-accent px-4 py-2.5 text-sm font-semibold text-surface transition-opacity hover:opacity-90"
                  >
                    Create a project
                  </Link>
                )}
              </>
            )}

            {/* ── syncing ── */}
            {homepage?.userState === "syncing" && (
              <div className="flex items-center gap-3 rounded-lg border-2 border-border bg-surface p-4">
                <div className="h-3 w-3 animate-pulse rounded-full bg-success" />
                <p className="text-sm font-medium text-text">Importing your runs…</p>
              </div>
            )}

            {/* ── has_runs_no_project ── */}
            {homepage?.userState === "has_runs_no_project" && (
              <>
                <div className="rounded-lg border-2 border-border bg-surface p-4">
                  <p className="text-sm text-text">
                    Your runs are ready
                    {homepage.totalDistanceKm != null && homepage.totalDistanceKm > 0
                      ? ` — ${homepage.totalDistanceKm} km tracked`
                      : ""}
                    . Create a project to start tracking streets.
                  </p>
                  <Link
                    to="/projects/new"
                    className="mt-3 inline-flex items-center justify-center rounded-lg border-2 border-border bg-accent px-4 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-90"
                  >
                    Create a project
                  </Link>
                </div>
                <NextRunCard data={homepage} onShowOnMap={handleShowOnMap} />
                <LastRunCard data={homepage} />
                {homepage.alternates.length > 0 && (
                  <AlternatesList
                    alternates={homepage.alternates}
                    onShowOnMap={handleShowAlternateOnMap}
                  />
                )}
              </>
            )}

            {/* ── project_processing ── */}
            {homepage?.userState === "project_processing" && (
              <>
                <div className="flex items-center gap-3 rounded-lg border-2 border-border bg-surface p-4">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-warning" />
                  <p className="text-sm font-medium text-text">Processing your runs…</p>
                </div>
                <NextRunCard data={homepage} onShowOnMap={handleShowOnMap} />
                <LastRunCard data={homepage} />
              </>
            )}

            {/* ── active ── */}
            {homepage?.userState === "active" && (
              <>
                <NextRunCard data={homepage} onShowOnMap={handleShowOnMap} />
                <LastRunCard data={homepage} />
                <StreetStats streets={streets} />
                {homepage.alternates.length > 0 && (
                  <AlternatesList
                    alternates={homepage.alternates}
                    onShowOnMap={handleShowAlternateOnMap}
                  />
                )}
              </>
            )}

            {/* Empty state for brand-new users with absolutely nothing */}
            {homepage &&
              homepage.userState === "brand_new" &&
              !homepage.primarySuggestion &&
              !homepage.lastRun &&
              !homepage.firstStreet &&
              streets.length === 0 && (
                <p className="text-center text-sm text-text-muted">
                  Sync your Strava runs to see your streets light up on the map.
                </p>
              )}
          </div>
        )}
      </aside>
    </div>
  );
}
