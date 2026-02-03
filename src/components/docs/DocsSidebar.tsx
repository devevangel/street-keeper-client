/**
 * DocsSidebar Component
 * Sidebar navigation for the in-app docs viewer. Lists all doc pages with active state.
 */

import { NavLink } from "react-router-dom";
import { DOCS } from "../../docs";
import { ROUTES } from "../../config/constants";

interface DocsSidebarProps {
  /** When true, sidebar is shown (e.g. on mobile toggle). */
  isOpen?: boolean;
  /** Called when a link is clicked (e.g. close mobile sidebar). */
  onNavigate?: () => void;
}

export function DocsSidebar({ isOpen = true, onNavigate }: DocsSidebarProps) {
  return (
    <nav
      className={`flex flex-col border-r-2 border-border bg-surface py-4 transition-all md:sticky md:top-0 md:h-screen md:min-w-[200px] md:max-w-[220px] ${
        isOpen ? "block" : "hidden md:block"
      }`}
      aria-label="Documentation"
    >
      <ul className="space-y-1 px-3">
        {DOCS.map((doc) => (
          <li key={doc.slug}>
            <NavLink
              to={
                doc.slug === DOCS[0].slug
                  ? ROUTES.DOCS
                  : `${ROUTES.DOCS}/${doc.slug}`
              }
              onClick={onNavigate}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm font-medium no-underline transition-colors ${
                  isActive
                    ? "bg-accent text-bg"
                    : "text-text hover:bg-border/30"
                }`
              }
              end={doc.slug === DOCS[0].slug}
            >
              {doc.title}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
