/**
 * useLandingTheme
 * Manages light/dark mode for the landing page specifically.
 * Defaults to light mode. Persists to localStorage.
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "landing_theme";

export type LandingTheme = "light" | "dark";

export function useLandingTheme() {
  const [theme, setThemeState] = useState<LandingTheme>("light");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as LandingTheme | null;
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setTheme = useCallback((newTheme: LandingTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}
