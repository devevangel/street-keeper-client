/**
 * AppLayout
 * Main layout for authenticated app: header, tab navigation, and page content.
 * Renders children (Outlet) below the tab nav. Follows MAIN-STYLING-GUIDE for
 * spacing (8px grid), button touch targets (44px min), and typography.
 *
 * @example
 * <Route element={<AppLayout />}>
 *   <Route path="home" element={<HomePage />} />
 * </Route>
 */

import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../common";
import { TabNav } from "./TabNav";
import { PendingCelebrationsChecker } from "../milestones/PendingCelebrationsChecker";
import { ROUTES } from "../../config/constants";

/** Nav link styled to match Button secondary sm: same border, radius, padding, and font as Log out */
const navLinkClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 border-border bg-bg px-3 py-2 text-sm font-semibold text-text no-underline hover:bg-border/10 hover:opacity-90 transition-opacity";

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      <PendingCelebrationsChecker />
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3">
        <h1 className="text-xl font-bold text-text">Street Keeper</h1>
        <div className="flex items-center gap-4">
          <Link to={ROUTES.DOCS} className={navLinkClass}>
            Docs
          </Link>
          <Link to={ROUTES.PREFERENCES} className={navLinkClass}>
            Settings
          </Link>
          {user?.profilePic ? (
            <img
              src={user.profilePic}
              alt=""
              className="h-8 w-8 rounded-full border border-border"
              width={32}
              height={32}
            />
          ) : (
            <span className="text-sm text-text-muted" aria-hidden="true">
              {user?.name ?? "User"}
            </span>
          )}
          <Button type="button" variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>

      <div className="shrink-0">
        <TabNav />
      </div>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto md:overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
