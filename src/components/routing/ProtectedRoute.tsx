/**
 * Protected Route
 * Wraps routes that require authentication.
 * Renders children immediately; redirects to landing only after auth resolves as unauthenticated.
 */

import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../config/constants";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (!isLoading && !isAuthenticated) {
    return <Navigate to={ROUTES.LANDING} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
