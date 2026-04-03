import type { ReactNode } from "react";

export interface SectionHeadingProps {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({
  children,
  action,
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={["mb-2 flex items-center justify-between gap-2", className].join(" ")}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {children}
      </h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
