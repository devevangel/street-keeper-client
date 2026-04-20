/**
 * Card Component
 * Container for content. Uses card background, radius, and soft shadow tokens.
 */

import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Padding: none | sm | md | lg */
  padding?: "none" | "sm" | "md" | "lg";
  /** Visual style for common card use cases */
  variant?: "default" | "outlined" | "elevated";
  /** Apply interactive hover treatment for clickable cards */
  hover?: boolean;
}

const paddingStyles = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
} as const;

const variantStyles = {
  default: "bg-card-bg shadow-sm",
  outlined: "bg-transparent border border-border shadow-none",
  elevated: "bg-card-bg shadow-md",
} as const;

export function Card({
  children,
  padding = "md",
  variant = "default",
  hover = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-card",
        variantStyles[variant],
        hover ? "transition-shadow duration-200 hover:shadow-md" : "",
        paddingStyles[padding],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
