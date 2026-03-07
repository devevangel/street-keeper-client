/**
 * useFirstTimeUser
 * Tracks whether the user has completed onboarding via localStorage.
 * Used by auth callback to show OnboardingModal for first-time users.
 */

import { useCallback, useState, useEffect } from "react";

const STORAGE_KEY = "onboarding_completed";

export function useFirstTimeUser() {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setIsFirstTime(!localStorage.getItem(STORAGE_KEY));
    } catch {
      setIsFirstTime(true);
    }
  }, []);

  const markComplete = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      setIsFirstTime(false);
    } catch {
      // ignore
    }
  }, []);

  return { isFirstTime, markComplete };
}
