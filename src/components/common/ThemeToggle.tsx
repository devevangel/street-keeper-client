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
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card-bg text-text-muted transition-colors duration-150 hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
