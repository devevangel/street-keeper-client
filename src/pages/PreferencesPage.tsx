/**
 * PreferencesPage
 * User preferences: distance unit, theme, date format, map defaults.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Select, ProgressLoader, PageHeader } from "../components/common";
import { useAuth } from "../contexts/AuthContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { useToast } from "../contexts/ToastContext";
import { ROUTES, DEFAULT_PROJECT_RADIUS_METERS } from "../config/constants";
import { MAP_THEMES, DEFAULT_MAP_THEME } from "../config/map-themes";
import { authService } from "../services/auth.service";
import { formatRadius as formatRadiusUtil, type DistanceUnit } from "../utils/format-distance";

const DEFAULT_PROJECT_RADIUS_OPTIONS_METERS = [
  100, 200, 300, 500, 1000, 2000, 5000,
] as const;

export function PreferencesPage() {
  const { user } = useAuth();
  const preferencesContext = usePreferences();
  const preferences = preferencesContext?.preferences ?? null;
  const isLoading = preferencesContext?.isLoading ?? true;
  const updatePreferencesFn = preferencesContext?.updatePreferences;

  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const [distanceUnit, setDistanceUnit] = useState("km");
  const [theme, setTheme] = useState("system");
  const [dateFormat, setDateFormat] = useState("short");
  const [mapStyle, setMapStyle] = useState(DEFAULT_MAP_THEME);
  const [defaultMapZoom, setDefaultMapZoom] = useState(15);
  const [defaultProjectRadius, setDefaultProjectRadius] = useState(DEFAULT_PROJECT_RADIUS_METERS);
  const [defaultStreetFilter, setDefaultStreetFilter] = useState("all");

  useEffect(() => {
    if (preferences) {
      setDistanceUnit(preferences.distanceUnit);
      setTheme(preferences.theme);
      setDateFormat(preferences.dateFormat);
      setMapStyle(preferences.mapStyle ?? DEFAULT_MAP_THEME);
      setDefaultMapZoom(preferences.defaultMapZoom);
      setDefaultProjectRadius(preferences.defaultProjectRadius);
      setDefaultStreetFilter(preferences.defaultStreetFilter);
    }
  }, [preferences]);

  const handleSave = async () => {
    if (!updatePreferencesFn) return;
    setSaving(true);
    try {
      await updatePreferencesFn({
        distanceUnit,
        theme,
        dateFormat,
        mapStyle,
        defaultMapZoom,
        defaultProjectRadius,
        defaultStreetFilter,
      });
      toast?.showToast("Preferences saved.", "success");
    } catch {
      toast?.showToast("Failed to save preferences.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !preferences) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <ProgressLoader type="preferences" size="md" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-8 md:flex md:min-h-0 md:flex-1 md:flex-col md:overflow-y-auto md:pb-4">
      <PageHeader
        title="Preferences"
        breadcrumbs={[
          { label: "Home", to: ROUTES.HOME },
          { label: "Preferences" },
        ]}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={saving || !updatePreferencesFn}
            className="shrink-0"
          >
            {saving ? "Saving…" : "Save preferences"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:max-w-4xl">
          {/* Display preferences */}
          <Card padding="sm" className="space-y-3">
            <h2 className="text-base font-semibold text-text">Display</h2>
            <Select
              label="Distance unit"
              value={distanceUnit}
              onChange={(e) => setDistanceUnit(e.target.value)}
              options={[
                { value: "km", label: "Kilometers" },
                { value: "miles", label: "Miles" },
                { value: "meters", label: "Meters" },
              ]}
            />
            <Select
              label="Theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
            <Select
              label="Date format"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              options={[
                { value: "short", label: "Short (e.g. Jan 15, 26)" },
                { value: "long", label: "Long (e.g. January 15, 2026)" },
                { value: "numeric", label: "Numeric (e.g. 15/01/2026)" },
              ]}
            />
          </Card>

          {/* Map preferences */}
          <Card padding="sm" className="space-y-3">
            <h2 className="text-base font-semibold text-text">Map</h2>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text">Map style</label>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {MAP_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMapStyle(t.id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 p-1.5 transition ${
                      mapStyle === t.id
                        ? "border-primary ring-1 ring-primary"
                        : "border-border hover:border-text-muted"
                    }`}
                    aria-pressed={mapStyle === t.id}
                    title={t.description}
                  >
                    <span
                      className="h-6 w-full rounded sm:h-8"
                      style={{
                        background: `linear-gradient(135deg, ${t.preview.bg} 60%, ${t.preview.accent} 100%)`,
                      }}
                    />
                    <span className="text-xs font-medium text-text">{t.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-muted">
                {MAP_THEMES.find((t) => t.id === mapStyle)?.description}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text">Default map zoom (13–19)</label>
              <input
                type="range"
                min={13}
                max={19}
                value={defaultMapZoom}
                onChange={(e) => setDefaultMapZoom(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-text-muted">{defaultMapZoom}</span>
            </div>

            <Select
              label="Default project radius"
              value={String(defaultProjectRadius)}
              onChange={(e) => setDefaultProjectRadius(Number(e.target.value))}
              options={DEFAULT_PROJECT_RADIUS_OPTIONS_METERS.map((meters) => ({
                value: String(meters),
                label: formatRadiusUtil(meters, distanceUnit as DistanceUnit),
              }))}
            />

            <Select
              label="Default street filter (homepage)"
              value={defaultStreetFilter}
              onChange={(e) => setDefaultStreetFilter(e.target.value)}
              options={[
                { value: "all", label: "All" },
                { value: "completed", label: "Completed" },
                { value: "almostThere", label: "Almost there" },
                { value: "inProgress", label: "In progress" },
                { value: "notStarted", label: "Not started" },
              ]}
            />
          </Card>

          {/* Strava integration */}
          <Card padding="sm" className="space-y-3">
            <h2 className="text-base font-semibold text-text">Strava</h2>

            {user?.needsReauth && (
              <div className="rounded-lg border border-warning bg-warning/10 p-3">
                <p className="text-sm font-medium text-text">
                  Re-authorize to enable run descriptions
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Street Keeper needs updated permissions to optionally update your
                  Strava run descriptions when you choose to share. Your existing data is unaffected.
                </p>
                <a
                  href={authService.getStravaAuthUrl()}
                  className="mt-2 inline-block rounded bg-primary px-3 py-1.5 text-xs font-semibold text-surface hover:opacity-90"
                >
                  Re-authorize with Strava
                </a>
              </div>
            )}

            <p className="text-xs text-text-muted">
              When you finish a run that moves your projects forward, you&apos;ll see a celebration
              screen where you can preview a message and choose to post it to your Strava activity
              description — including #StreetKeeper #RunEveryStreet. Nothing is sent to Strava unless
              you confirm.
            </p>
            {import.meta.env.DEV ? (
              <p className="text-xs text-text-muted">
                <Link
                  to={`${ROUTES.HOME}?__celebration=demo`}
                  className="font-semibold text-accent underline-offset-2 hover:underline"
                >
                  Preview run celebration (dev)
                </Link>
              </p>
            ) : null}
          </Card>
        </div>
    </div>
  );
}
