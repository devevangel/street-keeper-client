/**
 * LandingPage
 * Fixed map background with animated section transitions (no scroll).
 * Uses AIDA framework: Attention → Interest → Desire → Action.
 * No fake data, benefit-driven copy, CTA on every section.
 */

import { useState, useEffect, useCallback } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authService } from "../services/auth.service";
import { ROUTES } from "../config/constants";
import {
  AnimatedMapDemo,
  StravaButton,
  GlassCard,
  ErrorAlert,
  IconBadge,
  ANIMATION_DURATION,
  OAUTH_ERROR_MESSAGES,
} from "../components/landing";
import {
  ChevronDown,
  ChevronUp,
  Repeat,
  Eye,
  Footprints,
  Trophy,
  ArrowRight,
  Zap,
  Map,
} from "lucide-react";

const SECTIONS = ["hero", "problem", "solution", "cta"] as const;

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error && OAUTH_ERROR_MESSAGES[error]) {
      setErrorMessage(OAUTH_ERROR_MESSAGES[error]);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCta = useCallback(() => {
    authService.loginWithStrava();
  }, []);

  const goToSection = useCallback(
    (direction: "next" | "prev") => {
      if (isAnimating) return;
      const nextIndex =
        direction === "next"
          ? Math.min(currentSection + 1, SECTIONS.length - 1)
          : Math.max(currentSection - 1, 0);
      if (nextIndex === currentSection) return;
      setIsAnimating(true);
      setCurrentSection(nextIndex);
      setTimeout(() => setIsAnimating(false), ANIMATION_DURATION.SECTION_TRANSITION);
    },
    [currentSection, isAnimating],
  );

  const jumpTo = useCallback(
    (i: number) => {
      if (isAnimating || i === currentSection) return;
      setIsAnimating(true);
      setCurrentSection(i);
      setTimeout(() => setIsAnimating(false), ANIMATION_DURATION.SECTION_TRANSITION);
    },
    [currentSection, isAnimating],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        goToSection("next");
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        goToSection("prev");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnimating, goToSection]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-text-muted">
        <span className="text-lg">Loading…</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  const isFirst = currentSection === 0;
  const isLast = currentSection === SECTIONS.length - 1;

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden">
      {/* Fixed Map Background */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <AnimatedMapDemo />
      </div>

      {/* Gradient Overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 5,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* Section Container */}
      <div className="relative flex h-full w-full flex-col" style={{ zIndex: 10 }}>

        {/* ═══ Section 1: HERO (Attention) ═══ */}
        <SlideSection active={currentSection === 0} gone={currentSection > 0 ? "up" : "none"}>
          <div className="flex h-full flex-col items-center justify-center px-5 text-center">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
              Turn Every Run Into<br />
              <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                City Exploration
              </span>
            </h1>
            <p className="mb-8 max-w-lg text-base text-white/85 drop-shadow-md sm:text-lg">
              See every street you've conquered on a live map.
              Track your progress. Run them all.
            </p>

            {errorMessage && (
              <div className="mb-4 max-w-md">
                <ErrorAlert message={errorMessage} />
              </div>
            )}

            <StravaButton onClick={handleCta} size="md" />
            <p className="mt-3 text-xs text-white/50">30-second setup</p>
          </div>
        </SlideSection>

        {/* ═══ Section 2: THE PROBLEM (Interest) ═══ */}
        <SlideSection active={currentSection === 1} gone={currentSection > 1 ? "up" : "down"}>
          <div className="flex h-full flex-col items-center justify-center px-5">
            <div className="w-full max-w-lg space-y-6 sm:max-w-2xl">
              {/* Problem statement */}
              <GlassCard padding="md">
                <div className="mb-4 flex items-center gap-3">
                  <IconBadge icon={Repeat} gradient="from-orange-500 to-amber-500" size="md" />
                  <h2 className="text-xl font-bold text-white sm:text-2xl">
                    Running the same routes?
                  </h2>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-white/75 sm:text-base">
                  Most runners stick to the same handful of streets without realising
                  how much of their city remains unexplored. Without a visual map,
                  there's no way to know what you're missing.
                </p>
                <p className="text-sm font-medium text-white/90 sm:text-base">
                  What if you could see <span className="text-green-400">exactly which streets you've run</span> —
                  and which ones are waiting?
                </p>
              </GlassCard>

              {/* Pain points */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { icon: Repeat, text: "Same routes, different day", color: "text-orange-400" },
                  { icon: Eye, text: "No visibility into progress", color: "text-blue-400" },
                  { icon: Map, text: "Unexplored streets everywhere", color: "text-purple-400" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-lg"
                  >
                    <item.icon className={`h-5 w-5 shrink-0 ${item.color}`} />
                    <span className="text-sm text-white/85">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA for this section */}
              <button
                onClick={() => goToSection("next")}
                className="group mx-auto flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/20"
                aria-label="See how it works"
              >
                See how it works
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </SlideSection>

        {/* ═══ Section 3: HOW IT WORKS (Desire) ═══ */}
        <SlideSection active={currentSection === 2} gone={currentSection > 2 ? "up" : "down"}>
          <div className="flex h-full flex-col items-center justify-center px-5">
            <div className="w-full max-w-lg space-y-5 sm:max-w-3xl">
              <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
                Three steps. Zero effort.
              </h2>
              <p className="mx-auto max-w-md text-center text-sm text-white/60">
                Street Keeper connects to your Strava automatically — just run.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    step: "01",
                    icon: Zap,
                    title: "Connect once",
                    benefit: "One tap to link Strava. Every run syncs automatically from then on.",
                    color: "from-orange-500 to-amber-500",
                  },
                  {
                    step: "02",
                    icon: Footprints,
                    title: "Just run",
                    benefit: "Run anywhere in your city. Every street you touch lights up green on your map.",
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    step: "03",
                    icon: Trophy,
                    title: "Watch progress grow",
                    benefit: "Set goals per neighbourhood. Earn milestones. See your city transform.",
                    color: "from-blue-500 to-indigo-500",
                  },
                ].map((item, i) => (
                  <GlassCard key={i} padding="md" className="relative overflow-hidden">
                    <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${item.color} opacity-20 blur-2xl`} />
                    <div className="relative">
                      <span className="mb-3 block text-xs font-bold tracking-widest text-white/40">
                        STEP {item.step}
                      </span>
                      <IconBadge icon={item.icon} gradient={item.color} size="md" className="mb-3" />
                      <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-white/65">{item.benefit}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={handleCta}
                  className="group inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-green-500 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-green-500/25 transition-all duration-200 hover:scale-105 hover:bg-green-400"
                >
                  Start mapping
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </SlideSection>

        {/* ═══ Section 4: FINAL CTA (Action) ═══ */}
        <SlideSection active={currentSection === 3} gone="down">
          <div className="flex h-full flex-col items-center justify-center px-5 text-center">
            <GlassCard padding="lg" className="w-full max-w-md sm:max-w-lg">
              <IconBadge icon={Map} gradient="from-green-500 to-emerald-500" size="lg" className="mx-auto mb-5 shadow-lg shadow-green-500/30" />
              <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
                Ready to see your city differently?
              </h2>
              <p className="mb-8 text-sm text-white/65 sm:text-base">
                No manual logging.<br />
                Just connect Strava and run.
              </p>
              <StravaButton onClick={handleCta} size="lg" fullWidth />
              <p className="mt-4 text-xs text-white/40">
                30-second setup · Syncs automatically · Works worldwide
              </p>
            </GlassCard>
          </div>
        </SlideSection>
      </div>

      {/* Navigation Arrows */}
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 gap-3 sm:bottom-8">
        <button
          onClick={() => goToSection("prev")}
          disabled={isAnimating || isFirst}
          className={`cursor-pointer rounded-full border border-white/20 bg-black/50 p-3 shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-black/70 disabled:opacity-40 disabled:cursor-not-allowed sm:p-4 ${
            isFirst ? 'pointer-events-none opacity-0' : ''
          }`}
          aria-label="Previous section"
        >
          <ChevronUp className="h-5 w-5 text-white sm:h-6 sm:w-6" />
        </button>
        <button
          onClick={() => goToSection("next")}
          disabled={isAnimating || isLast}
          className={`cursor-pointer rounded-full border border-white/20 bg-black/50 p-3 shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-black/70 disabled:opacity-40 disabled:cursor-not-allowed sm:p-4 ${
            isLast ? 'pointer-events-none opacity-0' : ''
          }`}
          aria-label="Next section"
        >
          <ChevronDown className="h-5 w-5 text-white sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Section Dots */}
      <div className="fixed right-4 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-2.5 sm:right-6 sm:gap-3">
        {SECTIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => jumpTo(i)}
            className={`cursor-pointer rounded-full transition-all duration-300 ${
              i === currentSection
                ? "h-3 w-3 scale-125 bg-white shadow-lg shadow-white/30"
                : "h-2.5 w-2.5 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to section ${i + 1}`}
            aria-current={i === currentSection ? "step" : undefined}
          />
        ))}
      </div>
    </div>
  );
}

/** Animated full-screen section with slide transitions */
function SlideSection({
  children,
  active,
  gone,
}: {
  children: React.ReactNode;
  active: boolean;
  gone: "up" | "down" | "none";
}) {
  let transform = "translateY(100%)";
  if (active) transform = "translateY(0)";
  else if (gone === "up") transform = "translateY(-100%)";

  return (
    <div
      className="absolute inset-0 will-change-transform"
      style={{
        transform,
        opacity: active ? 1 : 0,
        pointerEvents: active ? "auto" : "none",
        transition: `transform ${ANIMATION_DURATION.SECTION_TRANSITION}ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms ease`,
      }}
    >
      {children}
    </div>
  );
}
