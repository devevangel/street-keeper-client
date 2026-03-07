/**
 * StreetListItem – Reusable street list item with click-to-highlight support.
 * Used in HomePage project cards and ProjectCreatePage preview.
 * Highlight is triggered only on click (not hover) so the map does not jump when moving the cursor.
 */

import { usePreferences } from "../../contexts/PreferencesContext";
import { getStreetStatusMessage } from "../../utils/motivational-copy";

function formatLastRun(iso: string): string {
  try {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
    if (days === 0) return "Last: today";
    if (days === 1) return "Last: yesterday";
    if (days < 7) return `Last: ${days} days ago`;
    if (days < 14) return "Last: 1 week ago";
    return `Last: ${Math.floor(days / 7)} weeks ago`;
  } catch {
    return "";
  }
}

export interface StreetListItemData {
  name: string;
  osmIds: string[];
  percentage?: number;
  lengthKm?: number;
  highwayType?: string;
  segmentCount?: number;
  completed?: boolean;
  runCount?: number;
  lastRunDate?: string | null;
}

interface StreetListItemProps {
  street: StreetListItemData;
  onHighlight: (street: StreetListItemData) => void;
  onClearHighlight: () => void;
  /** Show percentage (homepage), length/type (preview), or just name (minimal) */
  variant?: "homepage" | "preview" | "minimal";
}

export function StreetListItem({
  street,
  onHighlight,
  onClearHighlight,
  variant = "homepage",
}: StreetListItemProps) {
  const preferences = usePreferences();
  const formatDistance = preferences?.formatDistance ?? ((m: number, p = 1) => `${(m / 1000).toFixed(p)} km`);

  const handleClick = () => {
    onHighlight(street);
  };

  const statusMessage =
    variant === "homepage" && street.percentage !== undefined
      ? getStreetStatusMessage(street.percentage)
      : null;
  const runInfo =
    variant === "homepage" && (street.runCount != null || street.lastRunDate)
      ? [
          street.runCount != null && street.runCount > 0 ? `Ran ${street.runCount}×` : null,
          street.lastRunDate ? formatLastRun(street.lastRunDate) : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;
  const segmentLabel =
    variant === "homepage" && street.segmentCount != null && !runInfo
      ? street.segmentCount === 1
        ? "1 segment"
        : `${street.segmentCount} segments`
      : null;

  return (
    <li
      className="flex min-h-[56px] cursor-pointer flex-col justify-center px-4 py-3 text-sm hover:bg-border/10 even:bg-border/5"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-text">{street.name}</span>
        {variant === "homepage" && street.percentage !== undefined && (
          <span className="shrink-0 text-text-muted">{Math.round(street.percentage)}%</span>
        )}
        {variant === "preview" && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {street.lengthKm !== undefined && (
              <span className="text-text-muted">{formatDistance(street.lengthKm * 1000, 2)}</span>
            )}
            {street.highwayType && (
              <span className="rounded bg-border/20 px-2 py-0.5 text-xs text-text-muted">
                {street.highwayType}
              </span>
            )}
          </div>
        )}
      </div>
      {variant === "homepage" && (statusMessage || runInfo || segmentLabel) && (
        <div className="mt-0.5 text-sm text-text-muted">
          {statusMessage}
          {runInfo ? ` · ${runInfo}` : segmentLabel ? ` · ${segmentLabel}` : ""}
        </div>
      )}
    </li>
  );
}
