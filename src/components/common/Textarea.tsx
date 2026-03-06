/**
 * Textarea Component
 * Multi-line text input with optional label and error message.
 * Accessibility: associated label, aria-invalid, aria-describedby for errors.
 */

import type { TextareaHTMLAttributes } from "react";
import { useId } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  id: idProp,
  className = "",
  required,
  rows = 3,
  ...props
}: TextareaProps) {
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
      <textarea
        id={id}
        required={required}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={[
          "w-full border border-border bg-surface px-3 py-2 text-text resize-y rounded-lg",
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
