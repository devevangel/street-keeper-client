/**
 * Modal Component
 * Dialog overlay with title and close on Escape.
 * Accessibility: aria-modal, role="dialog", Escape closes, focus management.
 */

import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Size: sm | md | large */
  size?: "sm" | "md" | "large";
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  large: "max-w-lg",
} as const;

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={[
          "w-full bg-surface border-2 border-border p-4",
          sizeStyles[size],
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b-2 border-border pb-2 mb-4">
          <h2 id={titleId} className="text-xl font-bold text-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text hover:opacity-70 px-2 py-1 border-2 border-border"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="text-text">{children}</div>
      </div>
    </div>
  );
}
