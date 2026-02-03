/**
 * HomePage
 * Map view: user's current location and streets they've run (completed = green, partial = yellow).
 * Uses useGeolocation and useMapStreets; shows street list with status and stats.
 */

import { useEffect, useState } from "react";
import { Card } from "../components/common";
import {
  LocationPrompt,
  MapStats,
  MapView,
  StreetList,
} from "../components/map";
import { useGeolocation, useMapStreets } from "../hooks";

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
  } = useMapStreets(
    position?.lat ?? null,
    position?.lng ?? null,
    DEFAULT_RADIUS
  );

  const [expandedOsmId, setExpandedOsmId] = useState<string | null>(null);

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

  const streets = data?.streets ?? [];

  return (
    <div className="space-y-4">
      <MapView position={position} streets={streets} />
      <MapStats
        totalStreets={data?.totalStreets ?? 0}
        completedCount={data?.completedCount ?? 0}
        partialCount={data?.partialCount ?? 0}
      />

      {streets.length === 0 ? (
        <Card>
          <p className="text-text-muted">
            No streets with progress in this area yet. Run some routes to see
            them here.
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
