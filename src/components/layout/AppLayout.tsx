/**
 * AppLayout
 * Main layout for authenticated app: header, tab navigation, and page content.
 * Renders children (Outlet) below the tab nav. Follows MAIN-STYLING-GUIDE for
 * spacing (8px grid), button touch targets (44px min), and typography.
 *
 * Provides `syncStatus` via Outlet context so a single useSyncStatus instance
 * powers the header widget and homepage refresh behavior.
 *
 * @example
 * <Route element={<AppLayout />}>
 *   <Route path="home" element={<HomePage />} />
 * </Route>
 */

import { useEffect, useCallback, useRef } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { activitiesService } from "../../services/activities.service";
import { Button } from "../common";
import { TabNav } from "./TabNav";
import { SyncStatusWidget } from "./SyncStatusWidget";
import { ROUTES } from "../../config/constants";
import { useSyncStatus } from "../../hooks/useSyncStatus";
import type { UseSyncStatusResult } from "../../hooks/useSyncStatus";

export type AppLayoutOutletContext = {
  syncStatus: UseSyncStatusResult;
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const syncStatus = useSyncStatus();
  const gapFillRanForUserId = useRef<string | null>(null);

  const silentGapFill = useCallback(async () => {
    try {
      const { needsBackgroundSync } = await activitiesService.getSyncGapCheck();
      if (!needsBackgroundSync) return;
      await activitiesService.syncFromStrava({ background: true });
      syncStatus.startPolling();
    } catch {
      /* ignore — user can retry from header if needed */
    }
  }, [syncStatus]);

  useEffect(() => {
    if (!user?.id) {
      gapFillRanForUserId.current = null;
      return;
    }
    if (gapFillRanForUserId.current === user.id) return;
    gapFillRanForUserId.current = user.id;
    void silentGapFill();
  }, [user?.id, silentGapFill]);

  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-2">
        <h1 className="text-xl font-bold text-text">
          <span className="text-accent">Street</span> Keeper
        </h1>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
          <SyncStatusWidget sync={syncStatus} />
          <Link
            to={ROUTES.DOCS}
            className="hidden shrink-0 sm:inline-flex h-10 items-center rounded-[var(--radius-button)] px-4 text-sm font-semibold text-text-muted transition-colors duration-150 hover:bg-card-bg hover:text-text"
          >
            Docs
          </Link>
          <Link
            to={ROUTES.PREFERENCES}
            className="hidden shrink-0 sm:inline-flex h-10 items-center rounded-[var(--radius-button)] px-4 text-sm font-semibold text-text-muted transition-colors duration-150 hover:bg-card-bg hover:text-text"
          >
            Settings
          </Link>
          {user?.profilePic ? (
            <img
              src={user.profilePic}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full border border-border ring-2 ring-accent-from/40"
              width={32}
              height={32}
            />
          ) : (
            <span className="hidden shrink-0 text-sm text-text-muted sm:inline" aria-hidden="true">
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

      <main className="min-h-0 flex-1 overflow-y-auto md:flex md:flex-col md:overflow-hidden">
        <Outlet context={{ syncStatus } satisfies AppLayoutOutletContext} />
      </main>
    </div>
  );
}
