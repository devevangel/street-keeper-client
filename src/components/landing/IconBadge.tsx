/**
 * IconBadge
 * Icon with gradient background badge.
 * Used for step indicators, feature highlights, etc.
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface IconBadgeProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Gradient color classes (e.g., "from-green-500 to-emerald-500") */
  gradient: string;
  /** Badge size */
  size?: "sm" | "md" | "lg";
  /** Optional className */
  className?: string;
}

const sizeStyles = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
} as const;

const iconSizeStyles = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
} as const;

export function IconBadge({
  icon: Icon,
  gradient,
  size = "md",
  className = "",
}: IconBadgeProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg ${sizeStyles[size]} ${className}`}
    >
      <Icon className={`text-white ${iconSizeStyles[size]}`} />
    </div>
  );
}
