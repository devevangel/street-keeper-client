/**
 * PreferencesPage
 * User preferences: distance unit, theme, date format, map defaults.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Select } from "../components/common";
import { usePreferences } from "../contexts/PreferencesContext";
import { ROUTES, DEFAULT_PROJECT_RADIUS_METERS } from "../config/constants";

export function PreferencesPage() {
  const preferencesContext = usePreferences();
  const preferences = preferencesContext?.preferences ?? null;
  const isLoading = preferencesContext?.isLoading ?? true;
  const updatePreferencesFn = preferencesContext?.updatePreferences;

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [distanceUnit, setDistanceUnit] = useState("km");
  const [theme, setTheme] = useState("system");
  const [dateFormat, setDateFormat] = useState("short");
  const [defaultMapZoom, setDefaultMapZoom] = useState(15);
  const [defaultProjectRadius, setDefaultProjectRadius] = useState(DEFAULT_PROJECT_RADIUS_METERS);
  const [defaultStreetFilter, setDefaultStreetFilter] = useState("all");

  useEffect(() => {
    if (preferences) {
      setDistanceUnit(preferences.distanceUnit);
      setTheme(preferences.theme);
      setDateFormat(preferences.dateFormat);
      setDefaultMapZoom(preferences.defaultMapZoom);
      setDefaultProjectRadius(preferences.defaultProjectRadius);
      setDefaultStreetFilter(preferences.defaultStreetFilter);
    }
  }, [preferences]);

  const handleSave = async () => {
    if (!updatePreferencesFn) return;
    setSaving(true);
    setMessage(null);
    try {
      await updatePreferencesFn({
        distanceUnit,
        theme,
        dateFormat,
        defaultMapZoom,
        defaultProjectRadius,
        defaultStreetFilter,
      });
      setMessage({ type: "success", text: "Preferences saved." });
    } catch {
      setMessage({ type: "error", text: "Failed to save preferences." });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !preferences) {
    return (
      <div className="p-4">
        <p className="text-text-muted">Loading preferences…</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg">
      <nav className="mb-4 flex items-center gap-2 text-sm text-text-muted" aria-label="Breadcrumb">
        <Link to={ROUTES.HOME} className="hover:underline">Home</Link>
        <span aria-hidden>›</span>
        <span className="text-text" aria-current="page">Preferences</span>
      </nav>

      <h1 className="text-2xl font-bold text-text mb-4">Preferences</h1>

      <Card className="space-y-6">
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

        <div className="space-y-2">
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

        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-success" : "text-danger"}`} role="status">
            {message.text}
          </p>
        )}

        <Button variant="primary" size="md" onClick={handleSave} disabled={saving || !updatePreferencesFn} className="w-full">
          {saving ? "Saving…" : "Save preferences"}
        </Button>
      </Card>
    </div>
  );
}
