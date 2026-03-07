/**
 * Protected Route
 * Wraps routes that require authentication.
 * Redirects to landing when not authenticated; shows loading state while checking.
 */

import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../config/constants";
import { ProgressLoader } from "../common";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-bg text-text"
        role="status"
        aria-label="Loading"
      >
        <ProgressLoader type="general" size="lg" title="Street Keeper" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LANDING} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
