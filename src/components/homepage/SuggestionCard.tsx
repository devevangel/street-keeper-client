/**
 * Primary action card: one suggestion with "Show on map" CTA.
 */
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import type { HomepageSuggestion } from "../../services/homepage.service";

interface SuggestionCardProps {
  suggestion: HomepageSuggestion | null | undefined;
  isLoading?: boolean;
  onShowOnMap: () => void;
  onTrack?: (action: "show_on_map" | "view_milestones") => void;
}

export function SuggestionCard({
  suggestion,
  isLoading,
  onShowOnMap,
  onTrack,
}: SuggestionCardProps) {
  if (isLoading) {
    return (
      <Card className="space-y-2">
        <div className="h-5 bg-border/20 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-border/20 rounded animate-pulse w-full" />
        <div className="h-9 bg-border/20 rounded animate-pulse w-32" />
      </Card>
    );
  }
  if (!suggestion) {
    return (
      <Card>
        <p className="text-text-muted text-sm">
          Search an area to get a suggestion.
        </p>
      </Card>
    );
  }

  const handleClick = () => {
    onTrack?.("show_on_map");
    onShowOnMap();
  };

  return (
    <Card>
      <h2 className="text-text font-semibold text-base">{suggestion.title}</h2>
      <p className="text-text-muted text-sm mt-1">{suggestion.shortCopy}</p>
      <Button
        type="button"
        variant="primary"
        size="md"
        className="mt-3"
        onClick={handleClick}
      >
        Show on map
      </Button>
    </Card>
  );
}
