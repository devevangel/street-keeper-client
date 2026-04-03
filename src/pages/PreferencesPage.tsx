/**
 * PreferencesPage
 * User preferences: distance unit, theme, date format, map defaults.
 */

import { useEffect, useState } from "react";
import { Button, Card, Select, ProgressLoader, PageHeader } from "../components/common";
import { usePreferences } from "../contexts/PreferencesContext";
import { useToast } from "../contexts/ToastContext";
import { ROUTES, DEFAULT_PROJECT_RADIUS_METERS } from "../config/constants";
import { MAP_THEMES, DEFAULT_MAP_THEME } from "../config/map-themes";

export function PreferencesPage() {
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
              label="Default project radius (m)"
              value={String(defaultProjectRadius)}
              onChange={(e) => setDefaultProjectRadius(Number(e.target.value))}
              options={[
                { value: "100", label: "100 m" },
                { value: "200", label: "200 m" },
                { value: "300", label: "300 m" },
                { value: "500", label: "500 m" },
                { value: "1000", label: "1 km" },
                { value: "2000", label: "2 km" },
                { value: "5000", label: "5 km" },
              ]}
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
        </div>
    </div>
  );
}
