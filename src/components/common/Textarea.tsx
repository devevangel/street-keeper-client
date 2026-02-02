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
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-text font-bold">
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
          "w-full border-2 border-border bg-surface px-3 py-2 text-text resize-y",
          "disabled:opacity-50 disabled:cursor-not-allowed",
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
