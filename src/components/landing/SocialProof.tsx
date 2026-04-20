/**
 * SocialProof
 * Instead of fake testimonials, we show real value props and a compelling "why" section
 * inspired by successful fitness/exploration apps (Strava, CityStrides, Wandrer).
 * Stats animate on scroll.
 */

import { useEffect, useRef, useState } from "react";
import { MapPin, TrendingUp, Target, Zap } from "lucide-react";

const VALUE_PROPS = [
  {
    icon: MapPin,
    headline: "Every street counts",
    detail: "We track every road, lane, and path from your Strava runs and show exactly what you've covered.",
  },
  {
    icon: TrendingUp,
    headline: "Watch your map fill up",
    detail: "Grey streets turn green as you run them. It's satisfying, addictive, and keeps you exploring new routes.",
  },
  {
    icon: Target,
    headline: "Set your own challenge",
    detail: "Pick a neighbourhood, borough, or your whole city. We'll track your progress towards 100%.",
  },
  {
    icon: Zap,
    headline: "Auto-syncs with Strava",
    detail: "Connect once and forget. Every new run updates your map automatically — no manual logging.",
  },
];

function useCountUp(end: number, durationMs: number, isVisible: boolean) {
  const [count, setCount] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafIdRef = useRef(0);

  useEffect(() => {
    if (!isVisible) {
      setCount(0);
      startRef.current = null;
      return;
    }
    startRef.current = null;

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      setCount(Math.round(t * end));
      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      }
    };
    rafIdRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [end, durationMs, isVisible]);

  return count;
}

function StatItem({
  value,
  suffix,
  label,
  isVisible,
}: {
  value: number;
  suffix: string;
  label: string;
  isVisible: boolean;
}) {
  const isDecimal = !Number.isInteger(value);
  const internalEnd = isDecimal ? Math.round(value * 10) : value;
  const count = useCountUp(internalEnd, 1500, isVisible);
  const display = isDecimal ? (count / 10).toFixed(1) : String(count);

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-text md:text-4xl">
        {display}
        {suffix}
      </div>
      <div className="mt-1 text-sm text-text-muted">{label}</div>
    </div>
  );
}

export function SocialProof() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="mx-auto max-w-5xl">
      {/* Value props grid */}
      <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">
        Why runners love Street Keeper
      </h2>
      <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {VALUE_PROPS.map((vp, i) => {
          const Icon = vp.icon;
          return (
            <div
              key={i}
              className="group rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-success/50 hover:shadow-lg"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Icon className="h-5 w-5 text-success" aria-hidden />
              </div>
              <h3 className="mb-1 font-semibold text-text">{vp.headline}</h3>
              <p className="text-sm leading-relaxed text-text-muted">{vp.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Animated stat counters */}
      <div
        ref={statsRef}
        className="flex flex-wrap items-center justify-center gap-12 md:gap-20"
      >
        <StatItem value={100} suffix="%" label="Free — no subscription" isVisible={isVisible} />
        <StatItem value={5} suffix=" min" label="Setup time" isVisible={isVisible} />
        <StatItem value={0} suffix="" label="Manual logging needed" isVisible={isVisible} />
      </div>
    </section>
  );
}
