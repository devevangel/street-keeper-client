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

import { useState, useCallback } from "react";
import { Link, Outlet } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { activitiesService } from "../../services/activities.service";
import { Button } from "../common";
import { TabNav } from "./TabNav";
import { PendingCelebrationsChecker } from "../milestones/PendingCelebrationsChecker";
import { ROUTES } from "../../config/constants";

export function AppLayout() {
  const { user, logout } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const handleSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await activitiesService.syncFromStrava({ background: true });
    } catch {
      // swallow — SyncBanner / useSyncStatus on HomePage will surface errors
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      <PendingCelebrationsChecker />
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-2">
        <h1 className="text-xl font-bold text-text">
          <span className="text-accent">Street</span> Keeper
        </h1>
        <div className="flex items-center gap-4">
          <Link
            to={ROUTES.DOCS}
            className="inline-flex h-10 items-center rounded-[var(--radius-button)] px-4 text-sm font-semibold text-text-muted transition-colors duration-150 hover:bg-card-bg hover:text-text"
          >
            Docs
          </Link>
          <Link
            to={ROUTES.PREFERENCES}
            className="inline-flex h-10 items-center rounded-[var(--radius-button)] px-4 text-sm font-semibold text-text-muted transition-colors duration-150 hover:bg-card-bg hover:text-text"
          >
            Settings
          </Link>
          {user?.profilePic ? (
            <img
              src={user.profilePic}
              alt=""
              className="h-8 w-8 rounded-full border border-border ring-2 ring-accent-from/40"
              width={32}
              height={32}
            />
          ) : (
            <span className="text-sm text-text-muted" aria-hidden="true">
              {user?.name ?? "User"}
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={handleSync}
            disabled={syncing}
            title="Sync activities from Strava"
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync"}
          </Button>
          <Button type="button" variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>

      <div className="shrink-0">
        <TabNav />
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto md:flex md:flex-col md:overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
