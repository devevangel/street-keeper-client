/**
 * ProjectCreatePage
 * Create a project: search or pick location, choose radius (500m default), auto-preview, name, create.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import { Button, Card, Input } from "../components/common";
import { UniversalSearchInput } from "../components/projects";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api-client";
import { useGeolocation } from "../hooks";
import { ROUTES } from "../config/constants";
import type { ProjectPreview } from "../types/api.types";
import type { GeocodingResult } from "../types/api.types";

const RADIUS_OPTIONS: { value: 500 | 1000 | 2000 | 5000 | 10000; label: string }[] = [
  { value: 500, label: "500 m" },
  { value: 1000, label: "1 km" },
  { value: 2000, label: "2 km" },
  { value: 5000, label: "5 km" },
  { value: 10000, label: "10 km" },
];

type RadiusValue = 500 | 1000 | 2000 | 5000 | 10000;

const DEFAULT_CENTER: LatLngTuple = [50.8, -1.09];
const DEFAULT_ZOOM = 13;
const AUTO_PREVIEW_DEBOUNCE_MS = 400;

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

  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState<RadiusValue>(500);
  const [preview, setPreview] = useState<ProjectPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [includePartialStreets, setIncludePartialStreets] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const previewAbortRef = useRef<AbortController | null>(null);

  const boundaryMode = includePartialStreets ? "centroid" : "strict";

  const mapCenter: LatLngTuple = center
    ? [center.lat, center.lng]
    : geoPosition
      ? [geoPosition.lat, geoPosition.lng]
      : DEFAULT_CENTER;

  const hasCenter = center != null || geoPosition != null;
  const lat = center?.lat ?? geoPosition?.lat;
  const lng = center?.lng ?? geoPosition?.lng;

  const handleUseMyLocation = useCallback(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (geoPosition) setCenter({ lat: geoPosition.lat, lng: geoPosition.lng });
  }, [geoPosition]);

  const handleSearchSelect = useCallback((result: GeocodingResult) => {
    setCenter({ lat: result.lat, lng: result.lng });
    setPreview(null);
    setPreviewError(null);
  }, []);

  // Auto-preview when center or radius changes (debounced)
  useEffect(() => {
    if (lat == null || lng == null) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }
    const t = setTimeout(() => {
      previewAbortRef.current?.abort();
      previewAbortRef.current = new AbortController();
      setPreviewLoading(true);
      setPreviewError(null);
      projectsService
        .preview(lat, lng, radius, boundaryMode)
        .then((res) => {
          setPreview(res.preview);
        })
        .catch((err) => {
          setPreviewError(
            err instanceof ApiError ? err.message : "Failed to load preview"
          );
          setPreview(null);
        })
        .finally(() => {
          setPreviewLoading(false);
        });
    }, AUTO_PREVIEW_DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      previewAbortRef.current?.abort();
    };
  }, [lat, lng, radius, boundaryMode]);

  const handleCreate = useCallback(async () => {
    if (!preview || !name.trim() || lat == null || lng == null) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await projectsService.create({
        name: name.trim(),
        centerLat: lat,
        centerLng: lng,
        radiusMeters: radius,
        boundaryMode,
        cacheKey: preview.cacheKey,
      });
      navigate(`/projects/${res.project.id}`);
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? err.message : "Failed to create project"
      );
      setCreateLoading(false);
    }
  }, [preview, name, lat, lng, radius, navigate]);

  const canCreate = Boolean(
    hasCenter && preview?.cacheKey && name.trim() && !createLoading
  );

  return (
    <div className="p-4">
      <Link
        to={ROUTES.PROJECTS_LIST}
        className="text-sm text-text-muted hover:underline"
      >
        Back to projects
      </Link>
      <h2 className="mt-4 text-2xl font-bold text-text">Create New Project</h2>
      <p className="mt-1 text-sm text-text-muted">
        Search for a place or use the map. Choose radius, then name and create.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor="geocode-search" className="mb-1 block text-sm font-medium text-text">
              Where?
            </label>
            <UniversalSearchInput
              placeholder="Search anywhere: address, park, hospital…"
              onSelect={handleSearchSelect}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleUseMyLocation}
            disabled={geoLoading}
          >
            {geoLoading ? "Getting location…" : "Use my location"}
          </Button>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-text">Radius</span>
          <div className="flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="radio"
                  name="radius"
                  value={opt.value}
                  checked={radius === opt.value}
                  onChange={() => setRadius(opt.value)}
                  className="border-border text-primary focus:ring-primary"
                />
                <span className="text-text">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

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
              {hasCenter && (
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
        </Card>

        {hasCenter && (
          <Card padding="sm">
            {previewLoading ? (
              <p className="text-text-muted text-sm">Loading preview…</p>
            ) : previewError ? (
              <p className="text-danger text-sm">{previewError}</p>
            ) : preview ? (
              <p className="text-text">
                <strong>{preview.totalStreets}</strong> streets ·{" "}
                <strong>{(preview.totalLengthMeters / 1000).toFixed(1)}</strong>{" "}
                km total
              </p>
            ) : null}
            {preview?.warnings && preview.warnings.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-text-muted text-sm">
                {preview.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <Input
          label="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Portsmouth South"
          required
          maxLength={100}
        />

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={includePartialStreets}
            onChange={(e) => setIncludePartialStreets(e.target.checked)}
            className="border-border text-primary focus:ring-primary"
          />
          <span className="text-text text-sm">
            Include partial streets (streets that cross the boundary)
          </span>
        </label>

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
      </div>
    </div>
  );
}
