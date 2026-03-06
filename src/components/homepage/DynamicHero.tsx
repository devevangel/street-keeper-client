/**
 * Dynamic hero message (state-aware, one line).
 */
import type { HomepagePayload } from "../../services/homepage.service";

interface DynamicHeroProps {
  hero: HomepagePayload["hero"] | null | undefined;
  isLoading?: boolean;
}

export function DynamicHero({ hero, isLoading }: DynamicHeroProps) {
  if (isLoading) {
    return (
      <div className="h-10 bg-surface border-2 border-border rounded animate-pulse" />
    );
  }
  if (!hero?.message) return null;
  return (
    <p className="text-text text-lg font-medium" data-state-key={hero.stateKey}>
      {hero.message}
    </p>
  );
}
