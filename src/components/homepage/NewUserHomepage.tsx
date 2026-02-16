/**
 * New User Homepage
 * Simplified homepage for users with no activities yet.
 * Shows welcome message, first street card, map, and how it works.
 */
import { useCallback, useRef, useState } from "react";
import { DynamicHero } from "./DynamicHero";
import { FirstStreetCard } from "./FirstStreetCard";
import { MapView, type MapViewHighlightFocus } from "../map";
import type { HomepagePayload } from "../../services/homepage.service";
import type { MapStreet } from "../../types/api.types";

interface NewUserHomepageProps {
  data: HomepagePayload;
  isLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  streets: MapStreet[];
  onViewportChange: (center: { lat: number; lng: number }) => void;
}

export function NewUserHomepage({
  data,
  isLoading,
  userLocation,
  streets,
  onViewportChange,
}: NewUserHomepageProps) {
  const [highlightFocus, setHighlightFocus] =
    useState<MapViewHighlightFocus | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const handleShowOnMap = useCallback(() => {
    if (data.firstStreet) {
      setHighlightFocus({
        bbox: data.firstStreet.bbox,
        streetIds: undefined, // Will highlight based on bbox
        startPoint: data.firstStreet.geometry[0],
      });
      mapRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [data.firstStreet]);

  return (
    <div className="space-y-4">
      <DynamicHero hero={data.hero} isLoading={isLoading} />

      {data.firstStreet && (
        <FirstStreetCard
          street={{
            name: data.firstStreet.name,
            lengthMeters: data.firstStreet.lengthMeters,
            distanceFromUser: data.firstStreet.distanceFromUser,
          }}
          onShowOnMap={handleShowOnMap}
        />
      )}

      <div ref={mapRef}>
        <MapView
          mapCenter={userLocation}
          userLocation={userLocation}
          streets={streets}
          onViewportChange={onViewportChange}
          highlightFocus={highlightFocus}
        />
      </div>

      <div className="border-t-2 border-border pt-4">
        <button
          type="button"
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="text-text-muted text-sm font-medium hover:text-text transition-colors"
        >
          {showHowItWorks ? "Hide" : "How it works"} ↓
        </button>
        {showHowItWorks && (
          <ol className="mt-3 space-y-2 text-text-muted text-sm list-decimal list-inside">
            <li>Run any street</li>
            <li>Strava syncs automatically</li>
            <li>Watch your map fill in</li>
          </ol>
        )}
      </div>
    </div>
  );
}
