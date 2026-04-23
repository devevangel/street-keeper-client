import { useCallback, useMemo, useRef, useState } from "react";
import { useFormatters } from "../../contexts/PreferencesContext";
import { Button, Card, SectionHeading } from "../common";
import type {
  HomepageSuggestion,
} from "../../services/homepage.service";
import { isUnnamedStreet } from "../../utils/street-filters";

export type ScrollItem =
  { kind: "suggestion"; suggestion: HomepageSuggestion; isPrimary: boolean };

function estimateRunMinutes(distanceM: number): string {
  const mins = Math.round((distanceM / 1000) * 6);
  if (mins < 1) return "<1 min";
  return `~${mins} min`;
}

export interface RunSuggestionsProps {
  items: ScrollItem[];
  onViewArea: (s: HomepageSuggestion) => void;
}

export function RunSuggestions({
  items: rawItems,
  onViewArea,
}: RunSuggestionsProps) {
  const { formatDistance } = useFormatters();
  const items = useMemo(
    () => rawItems.filter((i) => !isUnnamedStreet(i.suggestion.title)),
    [rawItems],
  );
  if (items.length === 0) return null;

  const stripRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ dragging: false, startX: 0, startScrollLeft: 0 });
  const [activeDot, setActiveDot] = useState(0);

  const updateActiveDot = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth;
    if (cardWidth <= 0) return;
    const next = Math.round(el.scrollLeft / cardWidth);
    setActiveDot(Math.max(0, Math.min(items.length - 1, next)));
  }, [items.length]);

  const onMouseDown = (event: { clientX: number }) => {
    const el = stripRef.current;
    if (!el) return;
    dragRef.current.dragging = true;
    dragRef.current.startX = event.clientX;
    dragRef.current.startScrollLeft = el.scrollLeft;
  };

  const onMouseMove = (event: { clientX: number }) => {
    if (!dragRef.current.dragging) return;
    const el = stripRef.current;
    if (!el) return;
    const deltaX = event.clientX - dragRef.current.startX;
    el.scrollLeft = dragRef.current.startScrollLeft - deltaX;
  };

  const stopDragging = () => {
    dragRef.current.dragging = false;
  };

  const jumpToCard = (index: number) => {
    const el = stripRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth;
    el.scrollTo({ left: index * cardWidth, behavior: "smooth" });
  };

  return (
    <Card padding="none" className="w-full p-3">
      <SectionHeading>Next run suggestions</SectionHeading>
      <div
        ref={stripRef}
        className="scrollbar-hide flex snap-x snap-mandatory cursor-grab select-none overflow-x-auto overflow-y-hidden pb-1 active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={stopDragging}
        onMouseUp={stopDragging}
        onScroll={updateActiveDot}
      >
        {items.map((item, idx) => {
          const s = item.suggestion;
          const cs = s.clusterStats!;
          return (
            <Card
              key={`s-${s.cooldownKey}-${idx}`}
              padding="none"
              className="w-full min-w-full shrink-0 snap-start p-3 text-left"
            >
              <p className="text-sm font-bold leading-snug text-text">{s.title}</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <div className="rounded-lg bg-bg px-2.5 py-2">
                  <p className="text-lg font-bold leading-tight text-sky-400">
                    {cs.newStreets}
                  </p>
                  <p className="text-[11px] leading-tight text-text-muted">
                    streets to discover
                  </p>
                </div>
                <div className="rounded-lg bg-bg px-2.5 py-2">
                  <p className="text-lg font-bold leading-tight text-rose-400">
                    {cs.toFinish}
                  </p>
                  <p className="text-[11px] leading-tight text-text-muted">
                    streets to finish
                  </p>
                </div>
                <div className="rounded-lg bg-bg px-2.5 py-2">
                  <p className="text-lg font-bold leading-tight text-text">
                    ~{formatDistance(cs.estimatedDistanceM)}
                  </p>
                  <p className="text-[11px] leading-tight text-text-muted">
                    total distance
                  </p>
                </div>
                <div className="rounded-lg bg-bg px-2.5 py-2">
                  <p className="text-lg font-bold leading-tight text-text">
                    {estimateRunMinutes(cs.estimatedDistanceM)}
                  </p>
                  <p className="text-[11px] leading-tight text-text-muted">
                    est. run time
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-2 w-full text-xs"
                onClick={() => onViewArea(s)}
              >
                View area on map
              </Button>
            </Card>
          );
        })}
      </div>
      {items.length > 1 && (
        <div className="mt-1 flex items-center justify-center gap-2">
          {items.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              type="button"
              className={`size-2 rounded-full transition-opacity ${
                idx === activeDot ? "bg-text opacity-90" : "bg-text-muted/40 opacity-70"
              }`}
              onClick={() => jumpToCard(idx)}
              aria-label={`Show suggestion ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
