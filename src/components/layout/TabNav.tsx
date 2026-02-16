/**
 * TabNav Component
 * Horizontal tab navigation for main app sections (Home, Routes, Campaign).
 * Uses NavLink for active state; wireframe aesthetic with sharp borders.
 */

import { NavLink } from "react-router-dom";
import { ROUTES } from "../../config/constants";

const tabs = [
  { to: ROUTES.HOME, label: "Home" },
  { to: ROUTES.PROJECTS_LIST, label: "Projects" },
  { to: ROUTES.MILESTONES, label: "Milestones" },
  { to: ROUTES.CAMPAIGN, label: "Campaign" },
] as const;

export function TabNav() {
  return (
    <nav
      className="border-b-2 border-border bg-surface"
      aria-label="Main navigation"
    >
      <ul className="flex list-none gap-0 p-0 m-0">
        {tabs.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === ROUTES.HOME}
              className={({ isActive }) =>
                [
                  "block border-b-2 px-4 py-3 font-bold text-text no-underline transition-colors",
                  isActive
                    ? "border-accent bg-bg text-text"
                    : "border-transparent hover:bg-border/10",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
