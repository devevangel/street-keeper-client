/**
 * StepIndicator
 * Progress indicator for multi-step flows (onboarding, wizards, etc.).
 * Shows current step and total steps with visual progress bars.
 */

interface StepIndicatorProps {
  /** Current step (0-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Optional className */
  className?: string;
}

export function StepIndicator({
  currentStep,
  totalSteps,
  className = "",
}: StepIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i <= currentStep ? "bg-white" : "bg-white/20"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
