/**
 * ProgressLoader
 * An engaging loading widget that shows progress messages for long operations.
 * Progress advances linearly through messages - does NOT cycle back to start.
 * Once all messages are shown, stays on the final "almost there" message.
 */

import { useEffect, useState, useRef } from "react";

interface ProgressLoaderProps {
  /** Type of operation to show contextual messages */
  type?: "sync" | "map" | "project" | "analyze" | "general" | "projects" | "milestones" | "preferences" | "location";
  /** Optional custom title */
  title?: string;
  /** Show as overlay (absolute positioned) or inline */
  overlay?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const MESSAGES: Record<string, string[]> = {
  sync: [
    "Connecting to Strava…",
    "Fetching your latest activities…",
    "Processing your runs…",
    "Mapping routes to streets…",
    "Calculating your progress…",
    "Updating your stats…",
    "Almost done…",
  ],
  map: [
    "Loading map data…",
    "Fetching street geometries…",
    "Drawing your progress…",
    "Rendering streets…",
    "Finalizing…",
  ],
  project: [
    "Loading project…",
    "Fetching street data…",
    "Calculating completion…",
    "Building the map…",
    "Almost ready…",
  ],
  projects: [
    "Loading your projects…",
    "Fetching progress data…",
    "Calculating stats…",
    "Almost ready…",
  ],
  milestones: [
    "Loading milestones…",
    "Fetching your achievements…",
    "Calculating progress…",
    "Almost ready…",
  ],
  preferences: [
    "Loading preferences…",
    "Fetching your settings…",
    "Almost ready…",
  ],
  analyze: [
    "Analyzing your route…",
    "Matching GPS points to streets…",
    "Calculating coverage…",
    "Finding completed streets…",
    "Preparing results…",
  ],
  general: [
    "Loading…",
    "Working on it…",
    "Almost there…",
  ],
  location: [
    "Requesting your location…",
    "Checking permissions…",
    "Getting your coordinates…",
    "Almost ready…",
  ],
};

const MESSAGE_INTERVAL_MS = 2000;

export function ProgressLoader({
  type = "general",
  title,
  overlay = false,
  className = "",
  size = "md",
}: ProgressLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = MESSAGES[type] ?? MESSAGES.general;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset to 0 when type changes
    setMessageIndex(0);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Advance through messages linearly - stop at the last one (don't cycle)
    intervalRef.current = setInterval(() => {
      setMessageIndex((prev) => {
        const next = prev + 1;
        // Stop at last message - don't cycle back
        if (next >= messages.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return prev;
        }
        return next;
      });
    }, MESSAGE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [type, messages.length]);

  const spinnerSize = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  const gap = size === "sm" ? "gap-2" : size === "lg" ? "gap-4" : "gap-3";

  const content = (
    <div className={`flex flex-col items-center ${gap} text-center`}>
      {/* Animated spinner */}
      <div className="relative">
        <div className={`${spinnerSize} animate-spin rounded-full border-3 border-border border-t-success`} />
        <div
          className={`absolute inset-0 ${spinnerSize} animate-ping rounded-full border border-success/30`}
          style={{ animationDuration: "1.5s" }}
        />
      </div>

      {/* Title */}
      {title && (
        <p className={`${textSize} font-medium text-text`}>{title}</p>
      )}

      {/* Progress message - fade transition */}
      <p
        className={`min-h-[1.25rem] ${textSize} text-text-muted animate-fade-in`}
        key={messageIndex}
      >
        {messages[messageIndex]}
      </p>

      {/* Progress bar */}
      <div className="w-32 h-1.5 bg-border/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-success rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((messageIndex + 1) / messages.length) * 100}%` }}
        />
      </div>

      {/* Step indicator */}
      <p className={`${size === "sm" ? "text-[10px]" : "text-xs"} text-text-muted/60`}>
        Step {messageIndex + 1} of {messages.length}
      </p>
    </div>
  );

  if (overlay) {
    return (
      <div
        className={`absolute inset-0 z-[1000] flex items-center justify-center bg-bg/80 backdrop-blur-sm ${className}`}
      >
        {content}
      </div>
    );
  }

  return <div className={`py-8 ${className}`}>{content}</div>;
}

/** Compact inline loader for buttons/small areas */
export function InlineLoader({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span className="animate-pulse">Loading…</span>
    </span>
  );
}
