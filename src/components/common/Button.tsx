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
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "gradient";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  icon?: ReactNode;
}

const variantStyles = {
  primary: "bg-accent text-white border border-transparent hover:bg-accent-hover",
  secondary: "bg-card-bg text-text border border-border hover:bg-border/35",
  ghost: "bg-transparent text-text-muted border border-transparent hover:bg-card-bg hover:text-text",
  danger: "bg-danger text-white border border-transparent hover:brightness-95",
  success: "bg-success text-white border border-transparent hover:brightness-95",
  gradient:
    "bg-gradient-to-r from-accent-from to-accent-to text-white border border-transparent shadow-card hover:brightness-95",
} as const;

const sizeStyles = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
} as const;

export function Button({
  variant = "primary",
  size = "sm",
  className = "",
  disabled,
  children,
  icon,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-button)] font-semibold transition-colors duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(" ")}
      {...props}
    >
      {icon ? <span className="inline-flex items-center">{icon}</span> : null}
      {children}
    </button>
  );
}
