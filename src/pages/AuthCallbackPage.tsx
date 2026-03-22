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
import { activitiesService } from "../services/activities.service";
import { Button, Card, CelebrationModal } from "../components/common";
import { OnboardingModal } from "../components/onboarding/OnboardingModal";
import { AnimatedMapDemo, ErrorAlert, OAUTH_ERROR_MESSAGES } from "../components/landing";
import { useFirstTimeUser } from "../hooks/useFirstTimeUser";
import { useLandingTheme } from "../hooks/useLandingTheme";
import { ROUTES } from "../config/constants";

export function AuthCallbackPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const { isFirstTime, markComplete } = useFirstTimeUser();
  const { theme, isDark } = useLandingTheme();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [celebrationCount, setCelebrationCount] = useState<number | null>(null);
  const [activityCountChecked, setActivityCountChecked] = useState(false);

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
  }, [userId, errorParam, setUser]);

  // After login success: check backend for activity count. Returning users (count > 0) skip onboarding.
  useEffect(() => {
    if (status !== "success" || activityCountChecked) return;

    let cancelled = false;

    activitiesService
      .getAll(1, 1)
      .then((res) => {
        if (cancelled) return;
        const hasActivities = (res.total ?? 0) > 0;
        if (hasActivities) {
          markComplete();
          setActivityCountChecked(true);
          navigate(ROUTES.HOME, { replace: true });
          return;
        }
        if (isFirstTime === false) {
          setActivityCountChecked(true);
          navigate(ROUTES.HOME, { replace: true });
          return;
        }
        if (isFirstTime === true) {
          setActivityCountChecked(true);
          setShowOnboarding(true);
          return;
        }
        // isFirstTime still null (localStorage not read yet); effect will re-run when it resolves
      })
      .catch(() => {
        if (cancelled) return;
        setActivityCountChecked(true);
        if (isFirstTime === true) setShowOnboarding(true);
        else navigate(ROUTES.HOME, { replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [status, activityCountChecked, isFirstTime, markComplete, navigate]);

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
        <AnimatedMapDemo theme={theme} />
      </div>

      {/* Gradient for readability */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 5,
          background: isDark
            ? "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.5) 100%)"
            : "linear-gradient(to bottom, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.7) 100%)",
        }}
      />

      {/* Content layer */}
      <div className="relative flex h-full w-full items-center justify-center" style={{ zIndex: 10 }}>
        {/* Loading state */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={`h-8 w-8 animate-spin rounded-full border-2 ${
              isDark ? "border-white/30 border-t-white" : "border-gray-300 border-t-gray-700"
            }`} />
            <p className={`text-sm ${isDark ? "text-white/80" : "text-gray-700"}`}>Completing login…</p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <Card className={`mx-4 w-full max-w-md space-y-4 border backdrop-blur-xl ${
            isDark ? "border-white/15 bg-black/85" : "border-gray-200/70 bg-white/90"
          }`}>
            <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Login failed</h2>
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
