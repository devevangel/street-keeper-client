/**
 * AppLayout Component
 * Main layout for authenticated app: header, tab navigation, and page content.
 * Renders children (Outlet) below the tab nav.
 */

import { Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button, ThemeToggle } from "../common";
import { TabNav } from "./TabNav";

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <header className="flex items-center justify-between border-b-2 border-border bg-surface px-4 py-3">
        <h1 className="text-xl font-bold">Street Keeper</h1>
        <div className="flex items-center gap-3">
          {user?.profilePic ? (
            <img
              src={user.profilePic}
              alt=""
              className="h-8 w-8 rounded-full border-2 border-border"
              width={32}
              height={32}
            />
          ) : (
            <span className="text-text-muted text-sm" aria-hidden="true">
              {user?.name ?? "User"}
            </span>
          )}
          <ThemeToggle />
          <Button type="button" variant="secondary" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <TabNav />

      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
