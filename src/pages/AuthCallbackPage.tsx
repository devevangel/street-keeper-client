/**
 * AuthCallbackPage
 * Handles redirect from backend after Strava OAuth. Backend redirects here with userId.
 * Sets auth state (and x-user-id header), fetches user, then navigates home.
 */

import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";
import { Button, Card } from "../components/common";
import { ROUTES } from "../config/constants";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You denied access to Street Keeper.",
  missing_code: "Missing authorization. Please try logging in again.",
  invalid_code: "Invalid or expired login. Please try again.",
  auth_failed: "Login failed. Please try again.",
};

export function AuthCallbackPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const userId = searchParams.get("userId");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam) {
      setStatus("error");
      setErrorMessage(
        ERROR_MESSAGES[errorParam] ?? "Something went wrong. Please try again."
      );
      return;
    }

    if (!userId) {
      setStatus("error");
      setErrorMessage("Missing user. Please try logging in again.");
      return;
    }

    let cancelled = false;

    authService.setDevUserId(userId);
    authService
      .getCurrentUser()
      .then((res) => {
        if (!cancelled && res.user) {
          setUser(res.user);
          setStatus("success");
          navigate(ROUTES.HOME, { replace: true });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(err?.message ?? "Login failed. Please try again.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId, errorParam, setUser, navigate]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-text">
        <p className="text-text-muted">Completing login...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-4 text-text">
        <Card className="w-full max-w-md space-y-4">
          <h2 className="text-base font-semibold">Login failed</h2>
          <p className="text-sm text-text-muted" role="alert">
            {errorMessage}
          </p>
          <Link to={ROUTES.LOGIN}>
            <Button type="button" variant="primary">
              Try again
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return null;
}
