/**
 * HowItWorks
 * Three-step explainer: Connect Strava, See progress, Set goals.
 */

import { Link2, Map, Trophy } from "lucide-react";

const STEPS = [
  {
    icon: Link2,
    title: "Connect Strava",
    description: "Link your Strava account once. We use your runs to mark streets you’ve covered.",
  },
  {
    icon: Map,
    title: "See your progress",
    description: "Every street you run gets marked. Watch your map fill with green as you explore.",
  },
  {
    icon: Trophy,
    title: "Set goals and compete",
    description: "Create projects, hit milestones, and see how much of your city you’ve conquered.",
  },
];

export function HowItWorks() {
  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-12 text-center text-2xl font-bold md:text-3xl">
        How it works
      </h2>
      <div className="grid gap-10 md:grid-cols-3 md:gap-8">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="flex flex-col items-center text-center md:items-start md:text-left"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-bg">
                <Icon className="h-6 w-6 text-text" aria-hidden />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-text-muted">{step.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
