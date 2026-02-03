/**
 * AuthCallbackPage
 * Handles redirect from Strava OAuth. Exchanges code for user, sets auth state, navigates home.
 * Shows error and retry link if exchange fails.
 */

import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";
import { Button, Card } from "../components/common";
import { ROUTES } from "../config/constants";

export function AuthCallbackPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam === "access_denied") {
      setStatus("error");
      setErrorMessage("You denied access to Street Keeper.");
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMessage(
        "Missing authorization code. Please try logging in again."
      );
      return;
    }

    let cancelled = false;

    authService
      .getCallbackResponse(code)
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
  }, [code, errorParam, setUser, navigate]);

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
        <Card className="w-full max-w-md">
          <h2 className="mb-2 text-xl font-bold">Login failed</h2>
          <p className="mb-4 text-text-muted" role="alert">
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
