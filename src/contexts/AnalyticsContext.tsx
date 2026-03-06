/**
 * Analytics Context
 * Sends events to the backend for homepage_viewed, suggestion_opened, primary_action_clicked, sync_clicked.
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { apiClient } from "../lib/api-client";

interface AnalyticsContextValue {
  track: (
    event: string,
    properties?: Record<string, unknown>
  ) => Promise<void>;
  sessionId: string;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const sessionIdRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}`
  );

  const track = useCallback(
    async (event: string, properties?: Record<string, unknown>) => {
      try {
        await apiClient.post("/analytics/events", {
          events: [
            {
              event,
              properties: properties ?? {},
              sessionId: sessionIdRef.current,
              timestamp: new Date().toISOString(),
            },
          ],
        });
      } catch {
        // Fire-and-forget; do not break UI
      }
    },
    []
  );

  const value: AnalyticsContextValue = {
    track,
    sessionId: sessionIdRef.current,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    return {
      track: async () => {},
      sessionId: "",
    };
  }
  return ctx;
}
