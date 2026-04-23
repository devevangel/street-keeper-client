/**
 * Horizontal snap-scroll strip showing key stats in one swipeable card.
 *
 * Can be driven two ways:
 *   - Homepage convenience: pass `streetTotals` + `totalDistanceKm` + `totalActivities`
 *     and the component builds the four standard slides (Streets completed /
 *     This month / Total distance / Total runs, all "All time").
 *   - Custom: pass a `slides` prop directly for other contexts (e.g. the
 *     project detail page, where distance/runs are project-scoped).
 */
import { useCallback, useRef, useState } from "react";
import { Card } from "../common";
import { useFormatters } from "../../contexts/PreferencesContext";
import type { HomepagePayload } from "../../services/homepage.service";

export interface MetricSlide {
  label: string;
  value: string;
  subtitle?: string;
}

export interface MetricsStripProps {
  /** If provided, `slides` takes precedence; the other props are ignored. */
  slides?: MetricSlide[];
  streetTotals?: HomepagePayload["streetTotals"] | undefined;
  totalDistanceKm?: number | null;
  totalActivities?: number | null;
}

function buildHomepageSlides(
  streetTotals: HomepagePayload["streetTotals"] | undefined,
  totalDistanceKm: number | null | undefined,
  totalActivities: number | null | undefined,
  formatDistance: (m: number, precision?: number) => string,
): MetricSlide[] {
  return [
    {
      label: "Streets completed",
      value: streetTotals != null ? String(streetTotals.lifetimeStreetsCompleted) : "—",
      subtitle: "All time",
    },
    {
      label: "Streets completed",
      value: streetTotals != null ? String(streetTotals.streetsThisMonth) : "—",
      subtitle: streetTotals?.monthLabel
        ? `This month · ${streetTotals.monthLabel}`
        : "This month",
    },
    {
      label: "Total distance",
      value: totalDistanceKm != null ? formatDistance(totalDistanceKm * 1000, 2) : "—",
      subtitle: "All time",
    },
    {
      label: "Total runs",
      value: totalActivities != null ? String(totalActivities) : "—",
      subtitle: "All time",
    },
  ];
}

export function MetricsStrip({
  slides: slidesProp,
  streetTotals,
  totalDistanceKm,
  totalActivities,
}: MetricsStripProps) {
  const { formatDistance } = useFormatters();
  const slides: MetricSlide[] =
    slidesProp ??
    buildHomepageSlides(streetTotals, totalDistanceKm, totalActivities, formatDistance);

  const stripRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ dragging: false, startX: 0, startScrollLeft: 0 });
  const [activeDot, setActiveDot] = useState(0);
  const pageCount = Math.max(1, Math.ceil(slides.length / 2));

  const updateActiveDot = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const pageWidth = el.clientWidth;
    if (pageWidth <= 0) return;
    const next = Math.round(el.scrollLeft / pageWidth);
    setActiveDot(Math.max(0, Math.min(pageCount - 1, next)));
  }, [pageCount]);

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
    el.scrollLeft = dragRef.current.startScrollLeft - (event.clientX - dragRef.current.startX);
  };

  const stopDragging = () => {
    dragRef.current.dragging = false;
  };

  const jumpToPage = (index: number) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  const pages: MetricSlide[][] = [];
  for (let i = 0; i < slides.length; i += 2) {
    pages.push(slides.slice(i, i + 2));
  }

  return (
    <Card padding="none" className="w-full p-3">
      <div
        ref={stripRef}
        className="scrollbar-hide flex snap-x snap-mandatory cursor-grab select-none overflow-x-auto overflow-y-hidden active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={stopDragging}
        onMouseUp={stopDragging}
        onScroll={updateActiveDot}
      >
        {pages.map((pair, pageIdx) => (
          <div
            key={pageIdx}
            className="flex min-w-full shrink-0 snap-start gap-4"
          >
            {pair.map((slide, slideIdx) => (
              <div
                key={`${pageIdx}-${slideIdx}`}
                className={`min-w-0 flex-1 ${
                  slideIdx === 0 && pair.length > 1
                    ? "border-border/40 pr-4 sm:border-r"
                    : ""
                }`}
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                  {slide.label}
                </p>
                <p className="mt-1 whitespace-nowrap text-xl font-bold tabular-nums leading-tight text-text">
                  {slide.value}
                </p>
                {slide.subtitle ? (
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    {slide.subtitle}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
      {pageCount > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }, (_, idx) => (
            <button
              key={idx}
              type="button"
              className={`size-2 rounded-full transition-opacity ${
                idx === activeDot
                  ? "bg-text opacity-90"
                  : "bg-text-muted/40 opacity-70"
              }`}
              onClick={() => jumpToPage(idx)}
              aria-label={`Show stats page ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
