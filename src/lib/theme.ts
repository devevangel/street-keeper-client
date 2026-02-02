/**
 * Theme Utility
 * Manages light/dark mode with localStorage persistence and system preference fallback.
 * Call initTheme() before first render to prevent flash of wrong theme.
 */

const THEME_KEY = "theme";

/**
 * Initialize theme from localStorage or system preference.
 * Call once before React mounts (e.g. at top of main.tsx).
 */
export function initTheme(): void {
  const stored = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (stored === "dark" || (!stored && prefersDark)) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

/**
 * Toggle between light and dark theme.
 * Updates DOM and persists choice to localStorage.
 * @returns true if theme is now dark, false if light
 */
export function toggleTheme(): boolean {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  return isDark;
}

/**
 * Get current theme.
 * @returns "dark" | "light"
 */
export function getTheme(): "dark" | "light" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Set theme explicitly.
 * @param theme - "dark" or "light"
 */
export function setTheme(theme: "dark" | "light"): void {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem(THEME_KEY, theme);
}
