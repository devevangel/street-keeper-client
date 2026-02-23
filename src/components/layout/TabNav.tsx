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
    <nav
      className="border-b border-border bg-surface"
      aria-label="Main navigation"
    >
      <ul className="m-0 flex list-none gap-0 p-0">
        {tabs.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === ROUTES.HOME}
              className={({ isActive }) =>
                [
                  "flex min-h-[44px] items-center border-b-2 px-4 py-3 text-base font-semibold text-text no-underline transition-colors",
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
