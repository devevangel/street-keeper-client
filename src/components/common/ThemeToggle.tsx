/**
 * ThemeToggle Component
 * Button to toggle light/dark theme. Persists choice to localStorage.
 */

import { useState } from "react";
import { toggleTheme, getTheme } from "../../lib/theme";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => getTheme() === "dark");

  const handleClick = () => {
    const next = toggleTheme();
    setIsDark(next);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="h-8 min-h-8 cursor-pointer shrink-0 border-2 border-border bg-surface px-3 py-1 text-text text-sm font-bold transition-opacity hover:opacity-90"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "☀ Light" : "☽ Dark"}
    </button>
  );
}
