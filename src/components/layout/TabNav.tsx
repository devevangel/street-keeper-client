/**
 * TabNav
 * Horizontal tab navigation for main app sections. Uses NavLink for active state.
 * Follows MAIN-STYLING-GUIDE: 44px min touch target, 8px grid spacing, font-semibold for labels.
 *
 * @example
 * <TabNav />
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
    <nav className="border-b border-border bg-surface" aria-label="Main navigation">
      <ul className="m-0 flex list-none gap-0 overflow-x-auto p-0">
        {tabs.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === ROUTES.HOME}
              className={({ isActive }) =>
                [
                  "flex h-10 items-center border-b-2 px-4 py-2 text-sm font-semibold no-underline transition-all duration-200",
                  isActive
                    ? "border-accent bg-accent/5 text-text"
                    : "border-transparent text-text-muted hover:bg-accent/5 hover:text-text",
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
