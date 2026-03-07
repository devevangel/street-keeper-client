/**
 * Auth Context
 * Provides authentication state and methods to the app.
 * Supports Strava OAuth and development mode (x-user-id bypass).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService } from "../services/auth.service";
import type { AuthUser } from "../types/api.types";

const USER_STORAGE_KEY = "street-keeper-user";

interface AuthContextValue {
  /** Current user or null if not authenticated */
  user: AuthUser | null;
  /** True while checking auth on mount or restoring session */
  isLoading: boolean;
  /** True when user is set */
  isAuthenticated: boolean;
  /** Redirect to Strava OAuth (full page redirect) */
  login: () => void;
  /** Clear auth state and redirect to login */
  logout: () => void;
  /** Set user after OAuth callback or dev login. Updates API client header. */
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = useCallback((newUser: AuthUser | null) => {
    setUserState(newUser);
    authService.setDevUserId(newUser?.id ?? null);
    if (newUser) {
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      } catch {
        // ignore storage errors
      }
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  const login = useCallback(() => {
    authService.loginWithStrava();
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUserState(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      const devUserId = authService.restoreDevUser();
      if (devUserId) {
        if (!cancelled) {
          setUserState({ id: devUserId, name: "Dev User" });
        }
        setIsLoading(false);
        return;
      }

      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (!stored) {
        // No dev user and no stored session — skip /auth/me to avoid 401 on landing page
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const res = await authService.getCurrentUser();
        if (!cancelled && res.user) {
          setUserState(res.user);
          authService.setDevUserId(res.user.id);
        }
      } catch {
        try {
          const parsed = JSON.parse(stored) as AuthUser;
          if (!cancelled && parsed?.id) {
            setUserState(parsed);
            authService.setDevUserId(parsed.id);
          }
        } catch {
          // ignore
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
