/**
 * Preferences Context
 * Provides user preferences (distance unit, theme, etc.) and formatDistance helper.
 * Fetches preferences when user is authenticated.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { getPreferences, updatePreferences, type UserPreferences, type UpdatePreferencesInput } from "../services/preferences.service";
import {
  formatDistance as formatDistanceUtil,
  formatLength as formatLengthUtil,
  formatRadius as formatRadiusUtil,
  DEFAULT_DISTANCE_UNIT,
  type DistanceUnit,
} from "../utils/format-distance";
import { setTheme } from "../lib/theme";

const THEME_KEY = "theme";

interface PreferencesContextValue {
  preferences: UserPreferences | null;
  isLoading: boolean;
  updatePreferences: (data: UpdatePreferencesInput) => Promise<void>;
  formatDistance: (meters: number, precision?: number) => string;
  formatLength: (meters: number, precision?: number) => string;
  formatRadius: (meters: number) => string;
  formatDate: (date: Date | string) => string;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const [preferences, setPreferencesState] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    async function loadPreferences() {
      if (!isAuthenticated || !userId) {
        setPreferencesState(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const prefs = await getPreferences();
        if (cancelled) return;
        setPreferencesState(prefs);
        const themeValue = prefs.theme === "system"
          ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
          : (prefs.theme === "dark" ? "dark" : "light");
        setTheme(themeValue);
        localStorage.setItem(THEME_KEY, themeValue);
      } catch {
        if (!cancelled) setPreferencesState(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    
    loadPreferences();
    
    return () => {
      cancelled = true;
    };
  }, [userId, isAuthenticated]);

  const updatePreferencesFn = useCallback(async (data: UpdatePreferencesInput) => {
    const next = await updatePreferences(data);
    setPreferencesState(next);
    if (data.theme !== undefined) {
      const themeValue = data.theme === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : (data.theme === "dark" ? "dark" : "light");
      setTheme(themeValue);
      localStorage.setItem(THEME_KEY, themeValue);
    }
  }, []);

  const unit = (preferences?.distanceUnit ?? DEFAULT_DISTANCE_UNIT) as DistanceUnit;

  const formatDistance = useCallback(
    (meters: number, precision = 1) => {
      return formatDistanceUtil(meters, unit, precision);
    },
    [unit]
  );

  const formatLength = useCallback(
    (meters: number, precision = 1) => {
      return formatLengthUtil(meters, unit, precision);
    },
    [unit]
  );

  const formatRadius = useCallback(
    (meters: number) => {
      return formatRadiusUtil(meters, unit);
    },
    [unit]
  );

  const formatDate = useCallback(
    (date: Date | string) => {
      const d = typeof date === "string" ? new Date(date) : date;
      const fmt = preferences?.dateFormat ?? "short";
      if (fmt === "numeric") {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
      const options: Intl.DateTimeFormatOptions =
        fmt === "long"
          ? { month: "long", day: "numeric", year: "numeric" }
          : { month: "short", day: "numeric", year: "2-digit" };
      return d.toLocaleDateString("en-US", options);
    },
    [preferences?.dateFormat]
  );

  const value: PreferencesContextValue = {
    preferences,
    isLoading,
    updatePreferences: updatePreferencesFn,
    formatDistance,
    formatLength,
    formatRadius,
    formatDate,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue | null {
  return useContext(PreferencesContext);
}

function defaultFormatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

/**
 * Stable formatters that always work — uses user distance unit or {@link DEFAULT_DISTANCE_UNIT}
 * when preferences are not loaded or provider is missing.
 */
export function useFormatters(): Pick<
  PreferencesContextValue,
  "formatDistance" | "formatLength" | "formatRadius" | "formatDate"
> {
  const ctx = useContext(PreferencesContext);
  const unit = (ctx?.preferences?.distanceUnit ?? DEFAULT_DISTANCE_UNIT) as DistanceUnit;

  return useMemo(
    () => ({
      formatDistance: (meters: number, precision = 1) =>
        formatDistanceUtil(meters, unit, precision),
      formatLength: (meters: number, precision = 1) =>
        formatLengthUtil(meters, unit, precision),
      formatRadius: (meters: number) => formatRadiusUtil(meters, unit),
      formatDate: ctx?.formatDate ?? defaultFormatDate,
    }),
    [ctx?.formatDate, unit],
  );
}
