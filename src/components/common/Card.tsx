/**
 * Card Component
 * Container for content. Uses surface background and border token.
 */

import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Padding: none | sm | md | large */
  padding?: "none" | "sm" | "md" | "large";
}

const paddingStyles = {
  none: "p-0",
  sm: "p-2",
  md: "p-4",
  large: "p-6",
} as const;

export function Card({
  children,
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "bg-surface border-2 border-border",
        paddingStyles[padding],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
