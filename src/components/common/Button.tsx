/**
 * Button Component
 * Primary interactive element for user actions.
 * Uses token-based colors and supports variants and sizes.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variantStyles = {
  primary: "bg-accent text-surface border-border",
  secondary: "bg-surface text-text border-border hover:bg-border/10 hover:opacity-90",
  danger: "bg-danger text-surface border-border",
  success: "bg-success text-surface border-border",
} as const;

const sizeStyles = {
  sm: "px-2 py-1 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "cursor-pointer border-2 font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
