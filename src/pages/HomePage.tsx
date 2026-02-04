/**
 * HomePage
 * Map view: user's current location and streets they've run (completed = green, partial = yellow).
 * Uses useGeolocation and useMapStreets; shows street list with status and stats.
 */

import { useEffect, useState } from "react";
import { Button, Card } from "../components/common";
import {
  LocationPrompt,
  MapStats,
  MapView,
  StreetList,
} from "../components/map";
import { useGeolocation, useMapStreets } from "../hooks";
import { activitiesService } from "../services/activities.service";

const DEFAULT_RADIUS = 2000;

export function HomePage() {
  const {
    position,
    error: locationError,
    isLoading: locationLoading,
    requestPermission,
  } = useGeolocation();

  const {
    data,
    isLoading: fetchLoading,
    error: fetchError,
    refetch,
  } = useMapStreets(
    position?.lat ?? null,
    position?.lng ?? null,
    DEFAULT_RADIUS
  );

  const [expandedOsmId, setExpandedOsmId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    synced: number;
    error?: string;
  } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await activitiesService.syncFromStrava();
      setSyncResult({
        synced: result.synced + result.processed,
      });
      refetch();
    } catch (err) {
      setSyncResult({
        synced: 0,
        error: err instanceof Error ? err.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  if (locationLoading || locationError) {
    return (
      <LocationPrompt
        isLoading={locationLoading}
        error={locationError}
        onRetry={requestPermission}
      />
    );
  }

  if (fetchLoading && !data) {
    return (
      <div className="py-8" role="status" aria-label="Loading streets">
        <p className="text-text-muted">Loading streets near you...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <Card>
        <h2 className="mb-2 text-xl font-bold">Could not load streets</h2>
        <p className="text-text-muted" role="alert">
          {fetchError}
        </p>
      </Card>
    );
  }

  const segments = data?.segments ?? [];
  const streets = data?.streets ?? [];

  return (
    <div className="space-y-4">
      <MapView position={position} streets={segments} />
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? "Syncing..." : "Sync from Strava"}
        </Button>
        {syncResult && (
          <span
            className={
              syncResult.error
                ? "text-red-500"
                : "text-green-600 dark:text-green-400"
            }
          >
            {syncResult.error ??
              (syncResult.synced > 0
                ? `Synced ${syncResult.synced} activit${
                    syncResult.synced !== 1 ? "ies" : "y"
                  }`
                : "No new activities to sync")}
          </span>
        )}
      </div>
      <MapStats
        totalStreets={data?.totalStreets ?? 0}
        completedCount={data?.completedCount ?? 0}
        partialCount={data?.partialCount ?? 0}
      />

      {streets.length === 0 ? (
        <Card>
          <p className="mb-2 text-text-muted">
            No streets with progress in this area yet.
          </p>
          <p className="text-sm text-text-muted">
            Click &quot;Sync from Strava&quot; above to import your recent runs.
          </p>
        </Card>
      ) : (
        <StreetList
          streets={streets}
          expandedOsmId={expandedOsmId}
          onToggleExpand={(osmId) =>
            setExpandedOsmId((id) => (id === osmId ? null : osmId))
          }
        />
      )}
    </div>
  );
}
