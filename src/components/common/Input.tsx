/**
 * Input Component
 * Text input with optional label and error message.
 * Accessibility: associated label, aria-invalid, aria-describedby for errors.
 */

import type { InputHTMLAttributes } from "react";
import { useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  id: idProp,
  className = "",
  required,
  ...props
}: InputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="font-medium text-text">
          {label}
          {required && <span className="text-danger" aria-hidden> *</span>}
        </label>
      )}
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={[
          "min-h-[44px] w-full border border-border bg-surface px-3 py-2 text-text rounded-lg",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          error ? "border-danger" : "",
          className,
        ].join(" ")}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
