import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export interface PageHeaderBreadcrumb {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  title: string;
  breadcrumbs?: PageHeaderBreadcrumb[];
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  breadcrumbs,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <header className={["mb-6 space-y-2", className].join(" ")}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav
          className="flex items-center gap-2 text-xs text-text-muted"
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-2">
              {crumb.to ? (
                <Link to={crumb.to} className="hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-text" aria-current="page">
                  {crumb.label}
                </span>
              )}
              {index < breadcrumbs.length - 1 ? <span aria-hidden>›</span> : null}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold leading-[1.3] text-text">{title}</h1>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
