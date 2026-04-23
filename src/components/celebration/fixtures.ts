/**
 * Dev-only fixtures for run celebration UI preview.
 * Shape matches backend PendingCelebrationEventDto + batch rollup.
 */

import type { PendingCelebrationBatch, PendingCelebrationEventDto } from "../../services/celebrations.service";

const baseTime = "2026-04-20T08:30:00.000Z";

function makeEvent(
  overrides: Partial<PendingCelebrationEventDto> & Pick<PendingCelebrationEventDto, "id" | "projectId" | "projectName">,
): PendingCelebrationEventDto {
  return {
    activityId: "demo-activity-001",
    completedCount: 2,
    startedCount: 1,
    improvedCount: 1,
    completedStreetNames: ["Oak Avenue", "Maple Lane"],
    startedStreetNames: ["River Road"],
    improvedStreetNames: ["Cedar Street"],
    projectProgressBefore: 42,
    projectProgressAfter: 48,
    projectCompleted: false,
    activityDistanceMeters: 10234,
    activityDurationSeconds: 3120,
    activityStartDate: baseTime,
    shareMessage:
      "Street Keeper — Downtown loop\n\n" +
      "Completed: Oak Avenue, Maple Lane\n" +
      "Started: River Road\n" +
      "Improved: Cedar Street\n\n" +
      "#StreetKeeper #RunEveryStreet",
    createdAt: baseTime,
    ...overrides,
  };
}

/** Two projects, mixed buckets, realistic names. */
export function getDemoCelebrationFixture(
  mode: "demo" | "demoCompleted",
): PendingCelebrationBatch {
  const projectCompleted = mode === "demoCompleted";

  const events: PendingCelebrationEventDto[] = [
    makeEvent({
      id: "00000000-0000-4000-8000-000000000001",
      activityId: "strava-act-demo-7f3a",
      projectId: "00000000-0000-4000-8000-0000000000a1",
      projectName: "Downtown grid",
      completedStreetNames: ["Oak Avenue", "Maple Lane"],
      startedStreetNames: ["River Road"],
      improvedStreetNames: ["Cedar Street"],
      projectProgressBefore: 42,
      projectProgressAfter: projectCompleted ? 100 : 48,
      projectCompleted,
      shareMessage:
        "Street Keeper — Downtown grid\n\n" +
        "Completed: Oak Avenue, Maple Lane\n" +
        "Started: River Road\n" +
        "Improved: Cedar Street\n\n" +
        "#StreetKeeper #RunEveryStreet",
    }),
    makeEvent({
      id: "00000000-0000-4000-8000-000000000002",
      activityId: "strava-act-demo-7f3a",
      projectId: "00000000-0000-4000-8000-0000000000a2",
      projectName: "Riverside paths",
      completedCount: 0,
      startedCount: 2,
      improvedCount: 0,
      completedStreetNames: [],
      startedStreetNames: ["Willow Walk", "Bridge Approach"],
      improvedStreetNames: [],
      projectProgressBefore: 12,
      projectProgressAfter: 18,
      projectCompleted: false,
      shareMessage:
        "Street Keeper — Riverside paths\n\n" +
        "Started: Willow Walk, Bridge Approach\n\n" +
        "#StreetKeeper #RunEveryStreet",
    }),
  ];

  const rollup = {
    totalCompleted: events.reduce((s, e) => s + e.completedCount, 0),
    totalStarted: events.reduce((s, e) => s + e.startedCount, 0),
    totalImproved: events.reduce((s, e) => s + e.improvedCount, 0),
    activityCount: 1,
    projectCount: 2,
  };

  return {
    success: true,
    hasPending: true,
    events,
    rollup,
  };
}
