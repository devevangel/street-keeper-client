/**
 * PreferencesPage
 * User preferences: distance unit, theme, date format, map defaults.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "../components/common";
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

      <Card className="space-y-6 p-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">Distance unit</label>
          <select
            value={distanceUnit}
            onChange={(e) => setDistanceUnit(e.target.value)}
            className="w-full rounded border-2 border-border bg-surface px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="km">Kilometers</option>
            <option value="miles">Miles</option>
            <option value="meters">Meters</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full rounded border-2 border-border bg-surface px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Date format</label>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="w-full rounded border-2 border-border bg-surface px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="short">Short (e.g. Jan 15, 26)</option>
            <option value="long">Long (e.g. January 15, 2026)</option>
            <option value="numeric">Numeric (e.g. 15/01/2026)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Default map zoom (13–19)</label>
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

        <div>
          <label className="block text-sm font-medium text-text mb-2">Default project radius (m)</label>
          <select
            value={defaultProjectRadius}
            onChange={(e) => setDefaultProjectRadius(Number(e.target.value))}
            className="w-full rounded border-2 border-border bg-surface px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value={100}>100 m</option>
            <option value={200}>200 m</option>
            <option value={300}>300 m</option>
            <option value={500}>500 m</option>
            <option value={1000}>1 km</option>
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Default street filter (homepage)</label>
          <select
            value={defaultStreetFilter}
            onChange={(e) => setDefaultStreetFilter(e.target.value)}
            className="w-full rounded border-2 border-border bg-surface px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="almostThere">Almost there</option>
            <option value="inProgress">In progress</option>
            <option value="notStarted">Not started</option>
          </select>
        </div>

        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        )}

        <Button onClick={handleSave} disabled={saving || !updatePreferencesFn} className="w-full">
          {saving ? "Saving…" : "Save preferences"}
        </Button>
      </Card>
    </div>
  );
}
