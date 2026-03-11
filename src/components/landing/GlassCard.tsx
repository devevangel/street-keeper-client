/**
 * GlassCard
 * Reusable glassmorphism card component for landing page sections.
 * Provides consistent backdrop blur and border styling.
 */

import type { HTMLAttributes, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Padding size */
  padding?: "sm" | "md" | "lg";
  /** Border opacity */
  borderOpacity?: "low" | "medium" | "high";
}

const paddingStyles = {
  sm: "p-4 sm:p-5",
  md: "p-6 sm:p-8",
  lg: "p-8 sm:p-12",
} as const;

const borderStyles = {
  low: "border-white/10",
  medium: "border-white/15",
  high: "border-white/20",
} as const;

export function GlassCard({
  children,
  padding = "md",
  borderOpacity = "medium",
  className = "",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border bg-black/80 backdrop-blur-xl shadow-2xl ${paddingStyles[padding]} ${borderStyles[borderOpacity]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
