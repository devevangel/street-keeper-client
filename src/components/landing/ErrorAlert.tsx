/**
 * ErrorAlert
 * Reusable error message component for OAuth and form errors.
 * Provides consistent styling and accessibility.
 */

interface ErrorAlertProps {
  /** Error message to display */
  message: string;
  /** Optional className */
  className?: string;
}

export function ErrorAlert({ message, className = "" }: ErrorAlertProps) {
  return (
    <p
      className={`rounded-lg border border-amber-400/60 bg-amber-500/20 px-4 py-3 text-sm text-amber-200 backdrop-blur-sm ${className}`}
      role="alert"
      aria-live="polite"
    >
      {message}
    </p>
  );
}
