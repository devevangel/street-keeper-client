/**
 * OnboardingModal
 * Immersive first-time user flow over a live animated map background.
 * Mobile-first bottom-anchored cards with step indicators and smooth transitions.
 * 3 steps: Welcome → Map Legend → Sync progress.
 */

import { useState, useEffect, useCallback } from "react";
import { Footprints, Palette, RefreshCw, ArrowRight, ArrowLeft, X } from "lucide-react";
import { ProgressLoader } from "../common";
import { StepIndicator } from "./StepIndicator";
import { IconBadge } from "../landing/IconBadge";
import { ANIMATION_DURATION } from "../landing/constants";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (syncedCount?: number) => void;
}

const STEPS = [
  {
    icon: Footprints,
    title: "Welcome to Street Keeper",
    body: "Every street you run lights up on your personal city map. The more you explore, the more your map comes alive.",
    hint: "Look at the map behind — that's what your progress looks like.",
    cta: "Next",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Palette,
    title: "Reading your map",
    body: "Streets change colour as you run them:",
    hint: null,
    cta: "Next",
    color: "from-blue-500 to-indigo-500",
    legend: [
      { color: "bg-green-500", label: "Completed", desc: "You've run this street" },
      { color: "bg-amber-400", label: "In progress", desc: "Partially covered" },
      { color: "bg-gray-500", label: "Unexplored", desc: "Still waiting for you" },
    ],
  },
  {
    icon: RefreshCw,
    title: "Syncing your runs",
    body: "We're importing your Strava activities now. You'll be taken to your homepage shortly — streets will appear as they're processed.",
    hint: null,
    cta: null,
    color: "from-orange-500 to-amber-500",
  },
];

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setEntering(false), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const stableComplete = useCallback(
    (count?: number) => onComplete(count),
    [onComplete],
  );

  useEffect(() => {
    if (!isOpen || step !== 2 || syncing) return;
    setSyncing(true);

    // Fire off the Strava sync but don't block the user.
    // Move them to the homepage after a short delay so the sync continues in the background.
    import("../../services/activities.service").then(({ activitiesService }) => {
      const syncPromise = activitiesService.syncFromStrava();

      // Give it a few seconds; if it finishes fast, show the count.
      // Otherwise move the user to the homepage while sync continues.
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));

      Promise.race([syncPromise, timeout]).then((result) => {
        setSyncing(false);
        if (result && "synced" in result) {
          const count = result.synced ?? result.processed ?? 0;
          stableComplete(count);
        } else {
          stableComplete();
        }
      }).catch(() => {
        setSyncing(false);
        stableComplete();
      });
    });
  }, [isOpen, step, syncing, stableComplete]);

  if (!isOpen) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      {/* Subtle top gradient so map is visible but card area is readable */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Top-right skip */}
      <button
        onClick={() => stableComplete()}
        className="absolute right-4 top-4 z-10 flex cursor-pointer items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white sm:right-6 sm:top-6"
      >
        Skip <X className="h-3.5 w-3.5" />
      </button>

      {/* Pointer arrow from card toward map */}
      {step <= 1 && (
        <div className="relative z-10 mx-auto mb-2 flex flex-col items-center">
          <div className="animate-bounce text-white/60">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-180">
              <path d="M12 4l-8 8h5v8h6v-8h5L12 4z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-xs text-white/50">
            {step === 0 ? "Your live map" : "Watch the colours"}
          </span>
        </div>
      )}

      {/* Card */}
      <div
        className="relative z-10 mx-auto w-full max-w-lg transition-all ease-out"
        style={{
          transform: entering ? "translateY(100%)" : "translateY(0)",
          opacity: entering ? 0 : 1,
          transitionDuration: `${ANIMATION_DURATION.CARD_ENTER}ms`,
        }}
      >
        <div className="mx-3 mb-4 rounded-2xl border border-white/15 bg-black/90 p-5 shadow-2xl backdrop-blur-xl sm:mx-0 sm:mb-6 sm:p-7">
          {/* Step indicator */}
          <StepIndicator currentStep={step} totalSteps={STEPS.length} className="mb-4" />

          {/* Icon + Title */}
          <div className="mb-3 flex items-center gap-3">
            <IconBadge icon={Icon} gradient={current.color} size="md" />
            <h2 id="onboarding-title" className="text-lg font-bold text-white sm:text-xl">
              {current.title}
            </h2>
          </div>

          {/* Body */}
          <p className="mb-4 text-sm leading-relaxed text-white/75 sm:text-base">
            {current.body}
          </p>

          {/* Legend (step 2 only) */}
          {"legend" in current && current.legend && (
            <div className="mb-4 space-y-2">
              {current.legend.map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className={`h-4 w-8 rounded-sm ${item.color}`} />
                  <div>
                    <span className="text-sm font-medium text-white">{item.label}</span>
                    <span className="ml-2 text-xs text-white/50">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sync progress (step 3 only) */}
          {step === 2 && (
            <div className="my-4 flex flex-col items-center">
              <ProgressLoader type="sync" size="md" title="Syncing" />
              <p className="mt-3 text-xs text-white/40">This usually takes a few seconds</p>
            </div>
          )}

          {/* Hint */}
          {current.hint && (
            <p className="mb-4 rounded-lg bg-white/5 px-3 py-2 text-xs italic text-white/50">
              {current.hint}
            </p>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="group flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Previous
              </button>
            )}
            {!isLast && (
              <button
                onClick={() => setStep((s) => s + 1)}
                className={`group flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-all hover:bg-green-400 hover:text-white ${
                  step > 0 ? 'flex-1' : 'w-full'
                }`}
              >
                {current.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
