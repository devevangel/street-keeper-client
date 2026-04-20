/**
 * Landing page constants
 * Shared values used across landing page and onboarding components.
 */

/** Strava logo URL */
export const STRAVA_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg";

/** Animation durations (ms) */
export const ANIMATION_DURATION = {
  SECTION_TRANSITION: 600,
  CARD_ENTER: 500,
  BUTTON_HOVER: 200,
} as const;

/** Error messages for OAuth flows */
export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You denied access. Try again when you're ready.",
  missing_code: "Something went wrong. Please try again.",
  invalid_code: "Invalid or expired login. Please try again.",
  auth_failed: "Login failed. Please try again.",
} as const;
