/**
 * DocsLayout Component
 * Layout for the in-app docs viewer: header with title, back link, and Outlet for content.
 */

import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { ROUTES } from "../../config/constants";

export function DocsLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <header className="flex items-center justify-between border-b-2 border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            to={ROUTES.HOME}
            className="text-text-muted text-sm underline hover:text-text"
          >
            Back to app
          </Link>
          <h1 className="text-xl font-bold">Street Keeper Docs</h1>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
