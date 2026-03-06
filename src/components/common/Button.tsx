/**
 * Button Component
 * Primary interactive element for user actions. Follows MAIN-STYLING-GUIDE:
 * 8px border radius (rounded-lg), 44–48px min height, verb-phrase labels.
 * All new buttons should use this component so styling is consistent by default.
 *
 * @example
 * <Button variant="primary" size="md">Save Project</Button>
 * <Button variant="secondary" size="md">Cancel</Button>
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variantStyles = {
  primary: "bg-accent text-surface border-2 border-border",
  secondary: "bg-bg text-text border-2 border-border hover:bg-border/10 hover:opacity-90",
  ghost: "bg-transparent text-text border-0 border-transparent hover:bg-border/10 hover:opacity-90",
  danger: "bg-danger text-surface border-2 border-border",
  success: "bg-success text-surface border-2 border-border",
} as const;

const sizeStyles = {
  sm: "min-h-[44px] px-3 py-2 text-sm",
  md: "min-h-[44px] px-4 py-2 text-base",
  lg: "min-h-[48px] px-6 py-3 text-lg",
} as const;

export function Button({
  variant = "primary",
  size = "sm",
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
        "inline-flex cursor-pointer items-center justify-center rounded-lg font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
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
