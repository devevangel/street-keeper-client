/**
 * TabNav
 * Horizontal tab navigation for main app sections. Uses NavLink for active state.
 * Follows MAIN-STYLING-GUIDE: 44px min touch target, 8px grid spacing, font-semibold for labels.
 *
 * @example
 * <TabNav />
 */

import { NavLink } from "react-router-dom";
import { Book, Home, FolderOpen, Notebook, Settings } from "lucide-react";
import { ROUTES } from "../../config/constants";

const tabs = [
  { to: ROUTES.HOME, label: "Home", icon: Home },
  { to: ROUTES.PROJECTS_LIST, label: "Projects", icon: FolderOpen },
  { to: ROUTES.JOURNAL, label: "Journal", icon: Notebook },
  { to: ROUTES.PREFERENCES, label: "Settings", icon: Settings, mobileOnly: true },
  { to: ROUTES.DOCS, label: "Docs", icon: Book, mobileOnly: true },
] as const;

export function TabNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[1100] border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:static md:z-auto md:border-b md:border-t-0 md:pb-0"
      aria-label="Main navigation"
    >
      <ul className="m-0 flex list-none gap-0 p-0">
        {tabs.map(({ to, label, icon: Icon, ...rest }) => {
          const mobileOnly = "mobileOnly" in rest && rest.mobileOnly;
          return (
            <li key={to} className={`flex-1${mobileOnly ? " md:hidden" : ""}`}>
              <NavLink
                to={to}
                end={to === ROUTES.HOME}
                className={({ isActive }) =>
                  [
                    "flex h-12 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold no-underline transition-all duration-200 md:h-11 md:flex-row md:gap-0 md:text-sm",
                    isActive
                      ? "border-t-2 border-accent bg-accent/5 text-text md:border-b-2 md:border-t-0"
                      : "border-t-2 border-transparent text-text-muted hover:bg-accent/5 hover:text-text md:border-b-2 md:border-t-0",
                  ].join(" ")
                }
              >
                <Icon className="h-5 w-5 md:hidden" aria-hidden />
                <span>{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
