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
    return null;
  }

  const handleClick = () => {
    onTrack?.("show_on_map");
    onShowOnMap();
  };

  return (
    <Card className="space-y-3">
      <h2 className="text-base font-semibold text-text">{suggestion.title}</h2>
      <p className="text-sm text-text-muted">{suggestion.shortCopy}</p>
      <Button
        type="button"
        variant="primary"
        onClick={handleClick}
      >
        Show on map
      </Button>
    </Card>
  );
}
