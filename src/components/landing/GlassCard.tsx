/**
 * GlassCard
 * Reusable glassmorphism card component for landing page sections.
 * Supports light and dark themes with appropriate backdrop blur and border styling.
 */

import type { HTMLAttributes, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Padding size */
  padding?: "sm" | "md" | "lg";
  /** Border opacity */
  borderOpacity?: "low" | "medium" | "high";
  /** Theme variant — affects background and border colors */
  variant?: "dark" | "light";
}

const paddingStyles = {
  sm: "p-4 sm:p-5",
  md: "p-6 sm:p-8",
  lg: "p-8 sm:p-12",
} as const;

const darkBorderStyles = {
  low: "border-white/10",
  medium: "border-white/15",
  high: "border-white/20",
} as const;

const lightBorderStyles = {
  low: "border-gray-200/60",
  medium: "border-gray-300/70",
  high: "border-gray-400/50",
} as const;

export function GlassCard({
  children,
  padding = "md",
  borderOpacity = "medium",
  variant = "dark",
  className = "",
  ...props
}: GlassCardProps) {
  const isLight = variant === "light";
  const borderStyle = isLight ? lightBorderStyles[borderOpacity] : darkBorderStyles[borderOpacity];
  const bgStyle = isLight
    ? "bg-white/85 shadow-xl shadow-gray-900/5"
    : "bg-black/80 shadow-2xl";

  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl ${bgStyle} ${paddingStyles[padding]} ${borderStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
