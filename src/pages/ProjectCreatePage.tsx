/**
 * ProjectCreatePage
 * Create a project: click map to set center, choose radius, preview, name, create.
 */

import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import { Button, Card, Input, Select } from "../components/common";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { useGeolocation } from "../hooks";
import { ROUTES } from "../config/constants";
import type { ProjectPreview } from "../types/api.types";

const RADIUS_OPTIONS = [
  { value: "500", label: "500 m" },
  { value: "1000", label: "1 km" },
  { value: "2000", label: "2 km" },
  { value: "5000", label: "5 km" },
  { value: "10000", label: "10 km" },
] as const;

type RadiusValue = 500 | 1000 | 2000 | 5000 | 10000;

const DEFAULT_CENTER: LatLngTuple = [50.8, -1.09];
const DEFAULT_ZOOM = 13;

/** Listens for map clicks and reports lat/lng to parent */
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (point: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click: (e) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const {
    position: geoPosition,
    requestPermission,
    isLoading: geoLoading,
  } = useGeolocation();

  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [radius, setRadius] = useState<RadiusValue>(2000);
  const [preview, setPreview] = useState<ProjectPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const mapCenter: LatLngTuple = center
    ? [center.lat, center.lng]
    : geoPosition
    ? [geoPosition.lat, geoPosition.lng]
    : DEFAULT_CENTER;

  const handleUseMyLocation = useCallback(() => {
    requestPermission();
  }, [requestPermission]);

  // When geolocation returns after "Use my location", set center
  useEffect(() => {
    if (geoPosition) setCenter({ lat: geoPosition.lat, lng: geoPosition.lng });
  }, [geoPosition]);

  const applyGeoToCenter = useCallback(() => {
    if (geoPosition) setCenter({ lat: geoPosition.lat, lng: geoPosition.lng });
  }, [geoPosition]);

  const handlePreview = useCallback(async () => {
    const lat = center?.lat ?? geoPosition?.lat;
    const lng = center?.lng ?? geoPosition?.lng;
    if (lat == null || lng == null) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const res = await projectsService.preview(lat, lng, radius);
      setPreview(res.preview);
    } catch (err) {
      setPreviewError(
        err instanceof ApiError ? err.message : "Failed to load preview"
      );
    } finally {
      setPreviewLoading(false);
    }
  }, [center, geoPosition, radius]);

  const handleCreate = useCallback(async () => {
    if (!preview || !name.trim()) return;
    const lat = center?.lat ?? geoPosition?.lat;
    const lng = center?.lng ?? geoPosition?.lng;
    if (lat == null || lng == null) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await projectsService.create({
        name: name.trim(),
        centerLat: lat,
        centerLng: lng,
        radiusMeters: radius,
        cacheKey: preview.cacheKey,
      });
      navigate(`/projects/${res.project.id}`);
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? err.message : "Failed to create project"
      );
      setCreateLoading(false);
    }
  }, [center, geoPosition, preview, name, radius, navigate]);

  const canPreview = center != null || geoPosition != null;
  const canCreate = Boolean(preview?.cacheKey && name.trim() && !createLoading);

  return (
    <div className="p-4">
      <Link
        to={ROUTES.PROJECTS_LIST}
        className="text-sm text-text-muted hover:underline"
      >
        ← Back to projects
      </Link>
      <h2 className="mt-4 text-2xl font-bold text-text">New Project</h2>
      <p className="mt-1 text-sm text-text-muted">
        Click the map to set the center, choose a radius, then preview and
        create.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card padding="none" className="overflow-hidden">
          <div className="h-[320px] w-full">
            <MapContainer
              center={mapCenter}
              zoom={DEFAULT_ZOOM}
              className="h-full w-full"
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onMapClick={setCenter} />
              {(center ?? geoPosition) && (
                <>
                  <Marker
                    position={
                      center
                        ? [center.lat, center.lng]
                        : [geoPosition!.lat, geoPosition!.lng]
                    }
                  />
                  <Circle
                    center={
                      center
                        ? [center.lat, center.lng]
                        : [geoPosition!.lat, geoPosition!.lng]
                    }
                    radius={radius}
                    pathOptions={{
                      color: "#16a34a",
                      fillOpacity: 0.1,
                      weight: 2,
                    }}
                  />
                </>
              )}
            </MapContainer>
          </div>
          <div className="flex flex-wrap gap-2 border-t-2 border-border p-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={geoLoading}
            >
              {geoLoading ? "Getting location…" : "Use my location"}
            </Button>
            {geoPosition && !center && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={applyGeoToCenter}
              >
                Set center to my location
              </Button>
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Select
            label="Radius"
            options={RADIUS_OPTIONS}
            value={String(radius)}
            onChange={(e) => setRadius(Number(e.target.value) as RadiusValue)}
          />
          <Button
            type="button"
            onClick={handlePreview}
            disabled={!canPreview || previewLoading}
          >
            {previewLoading ? "Loading…" : "Preview streets"}
          </Button>
          {previewError && (
            <p className="text-danger text-sm">{previewError}</p>
          )}

          {preview && (
            <Card>
              <h3 className="mb-2 font-bold text-text">Preview</h3>
              <p className="text-text">
                <strong>{preview.totalStreets}</strong> streets ·{" "}
                <strong>{(preview.totalLengthMeters / 1000).toFixed(1)}</strong>{" "}
                km total length
              </p>
              {preview.warnings.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-sm text-text-muted">
                  {preview.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {preview && (
            <>
              <Input
                label="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Portsmouth South"
                required
                maxLength={100}
              />
              {createError && (
                <p className="text-danger text-sm">{createError}</p>
              )}
              <Button
                type="button"
                onClick={handleCreate}
                disabled={!canCreate}
              >
                {createLoading ? "Creating…" : "Create project"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
