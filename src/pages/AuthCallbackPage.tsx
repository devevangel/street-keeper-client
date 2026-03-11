/**
 * AuthCallbackPage
 * Handles redirect from backend after Strava OAuth.
 * Renders AnimatedMapDemo as a live background so the loading, onboarding,
 * and celebration states all feel immersive instead of floating on a void.
 */

import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";
import { Button, Card, CelebrationModal } from "../components/common";
import { OnboardingModal } from "../components/onboarding/OnboardingModal";
import { AnimatedMapDemo, ErrorAlert, OAUTH_ERROR_MESSAGES } from "../components/landing";
import { useFirstTimeUser } from "../hooks/useFirstTimeUser";
import { ROUTES } from "../config/constants";

export function AuthCallbackPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const { isFirstTime, markComplete } = useFirstTimeUser();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [celebrationCount, setCelebrationCount] = useState<number | null>(null);

  const userId = searchParams.get("userId");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam) {
      setStatus("error");
      setErrorMessage(
        OAUTH_ERROR_MESSAGES[errorParam] ?? "Something went wrong. Please try again.",
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
  }, [userId, errorParam, setUser, navigate, isFirstTime]);

  useEffect(() => {
    if (status !== "success" || isFirstTime === null) return;
    if (isFirstTime) setShowOnboarding(true);
    else navigate(ROUTES.HOME, { replace: true });
  }, [status, isFirstTime, navigate]);

  const handleOnboardingComplete = (syncedCount?: number) => {
    setShowOnboarding(false);
    markComplete();
    if (syncedCount != null && syncedCount > 0) {
      setCelebrationCount(syncedCount);
    } else {
      navigate(ROUTES.HOME, { replace: true });
    }
  };

  const handleCelebrationClose = () => {
    setCelebrationCount(null);
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden">
      {/* Live map background */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <AnimatedMapDemo />
      </div>

      {/* Gradient for readability */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 5,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* Content layer */}
      <div className="relative flex h-full w-full items-center justify-center" style={{ zIndex: 10 }}>
        {/* Loading state */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <p className="text-sm text-white/80">Completing login…</p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <Card className="mx-4 w-full max-w-md space-y-4 border border-white/15 bg-black/85 backdrop-blur-xl">
            <h2 className="text-base font-semibold text-white">Login failed</h2>
            <ErrorAlert message={errorMessage} />
            <Link to={ROUTES.LANDING}>
              <Button type="button" variant="primary">
                Try again
              </Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Onboarding overlay (renders over the map) */}
      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Celebration overlay */}
      {celebrationCount != null && (
        <CelebrationModal
          isOpen={true}
          onClose={handleCelebrationClose}
          title="You've already conquered some streets!"
          count={celebrationCount}
          countSuffix=" activities synced"
          message="Your map is ready. Head home to explore."
          autoDismissMs={0}
        />
      )}
    </div>
  );
}
