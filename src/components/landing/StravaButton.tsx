/**
 * StravaButton
 * Reusable button for Strava OAuth connection.
 * Includes Strava logo and consistent styling.
 */

import type { ButtonHTMLAttributes } from "react";
import { STRAVA_LOGO_URL } from "./constants";

interface StravaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button text (default: "Connect with Strava") */
  label?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Full width */
  fullWidth?: boolean;
}

const sizeStyles = {
  sm: "px-6 py-3 text-sm",
  md: "px-8 py-4 text-base",
  lg: "px-10 py-5 text-lg",
} as const;

export function StravaButton({
  label = "Connect with Strava",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}: StravaButtonProps) {
  return (
    <button
      type="button"
      className={`group inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-white font-semibold text-gray-900 shadow-2xl transition-all duration-200 hover:scale-105 hover:bg-green-400 hover:text-white ${
        fullWidth ? "w-full justify-center" : ""
      } ${sizeStyles[size]} ${className}`}
      {...props}
    >
      <img
        src={STRAVA_LOGO_URL}
        alt=""
        className="h-5 w-5 group-hover:brightness-0 group-hover:invert"
        aria-hidden="true"
      />
      {label}
    </button>
  );
}
