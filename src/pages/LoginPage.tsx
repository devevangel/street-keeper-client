/**
 * LoginPage
 * Entry point for unauthenticated users. Strava OAuth button and dev mode user ID input.
 * Handles ?error= query param when user denies OAuth.
 */

import { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button, Card } from "../components/common";
import { authService } from "../services/auth.service";
import { ROUTES } from "../config/constants";

export function LoginPage() {
  const { login, isAuthenticated, setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [devUserId, setDevUserId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam === "access_denied") {
      setErrorMessage("You denied access. Try again when you're ready.");
    }
  }, [errorParam]);

  const handleDevLogin = () => {
    const trimmed = devUserId.trim();
    if (!trimmed) return;
    authService.setDevUserId(trimmed);
    setUser({ id: trimmed, name: "Dev User" });
  };

  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-4 text-text">
      <Card className="w-full max-w-md">
        <h1 className="mb-2 text-2xl font-bold">Street Keeper</h1>
        <p className="mb-4 text-text-muted">
          Track the streets you run. Log in to get started.
        </p>

        {errorMessage && (
          <p
            className="mb-4 border-2 border-danger bg-danger/10 p-2 text-danger"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={login}
          >
            Login with Strava
          </Button>

          <div className="border-t-2 border-border pt-3">
            <p className="mb-2 text-sm text-text-muted">
              Development: use a user ID to bypass OAuth
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={devUserId}
                onChange={(e) => setDevUserId(e.target.value)}
                placeholder="User UUID"
                className="flex-1 border-2 border-border bg-surface px-3 py-2 text-text"
                aria-label="Dev user ID"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDevLogin}
              >
                Use Dev User
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
