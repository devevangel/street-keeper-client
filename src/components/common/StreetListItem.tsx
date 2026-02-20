/**
 * StreetListItem – Reusable street list item with hover/click highlight support.
 * Used in HomePage project cards and ProjectCreatePage preview.
 */

import { useMediaQuery } from "../../hooks";

export interface StreetListItemData {
  name: string;
  osmIds: string[];
  percentage?: number;
  lengthKm?: number;
  highwayType?: string;
  segmentCount?: number;
  completed?: boolean;
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
  const hasHover = useMediaQuery("(hover: hover)");

  const handleAction = () => {
    onHighlight(street);
  };

  return (
    <li
      className="cursor-pointer px-3 py-2 text-sm hover:bg-border/10 even:bg-border/5"
      onClick={hasHover ? undefined : handleAction}
      onMouseEnter={hasHover ? handleAction : undefined}
      onMouseLeave={hasHover ? onClearHighlight : undefined}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleAction();
        }
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-text">
          {street.name}
          {variant !== "minimal" && street.segmentCount && street.segmentCount > 1 && (
            <span className="ml-1.5 text-text-muted text-xs font-normal">
              ({street.segmentCount} parts)
            </span>
          )}
        </span>
        {variant === "homepage" && street.percentage !== undefined && (
          <span className="text-text-muted">{Math.round(street.percentage)}%</span>
        )}
        {variant === "preview" && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {street.lengthKm !== undefined && (
              <span className="text-text-muted">{street.lengthKm.toFixed(2)} km</span>
            )}
            {street.highwayType && (
              <span className="rounded bg-border/20 px-2 py-0.5 text-xs text-text-muted">
                {street.highwayType}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
