/**
 * Dev-only fixtures for run celebration UI preview.
 * Shape matches backend PendingCelebrationEventDto + batch rollup + map payload.
 */

import type {
  PendingCelebrationBatch,
  PendingCelebrationEventDto,
  CelebrationMapData,
} from "../../services/celebrations.service";

export type DemoCelebrationMode =
  | "demo"
  | "demoCompleted"
  | "demoLongRun"
  | "demoMorning";

const baseTime = "2026-04-20T08:30:00.000Z";
const morningTime = "2026-04-20T06:15:00.000Z";

/** Small loop + streets around a fixed point (San Francisco-ish) for the mini-map. */
const DEMO_CENTER: [number, number] = [37.7749, -122.4194];

function squareLoop(
  center: [number, number],
  delta: number,
  steps: number,
): [number, number][] {
  const [lat0, lng0] = center;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (t <= 0.25) pts.push([lat0 + delta * (t * 4), lng0 - delta]);
    else if (t <= 0.5) pts.push([lat0 + delta, lng0 - delta + delta * ((t - 0.25) * 4)]);
    else if (t <= 0.75) pts.push([lat0 + delta - delta * ((t - 0.5) * 4), lng0 + delta]);
    else pts.push([lat0 - delta, lng0 + delta - delta * ((t - 0.75) * 4)]);
  }
  return pts;
}

function seg(
  a: [number, number],
  b: [number, number],
  n: number,
): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

export function getDemoMapData(mode: DemoCelebrationMode): CelebrationMapData {
  const [lat0, lng0] = DEMO_CENTER;
  const d = 0.004;
  const runPath = squareLoop([lat0, lng0], d, 24);
  const oak = seg([lat0 - d * 0.5, lng0 - d], [lat0 + d * 0.5, lng0 - d], 8);
  const river = seg([lat0 - d, lng0], [lat0 + d * 0.3, lng0 + d * 0.8], 10);
  const willow = seg([lat0 + d * 0.2, lng0 + d * 0.3], [lat0 - d * 0.4, lng0 + d], 9);

  const streets =
    mode === "demo" || mode === "demoCompleted" || mode === "demoLongRun" || mode === "demoMorning"
      ? [
          { osmId: "way/1000000000001", bucket: "completed" as const, path: oak },
          { osmId: "way/1000000000002", bucket: "started" as const, path: river },
          { osmId: "way/1000000000003", bucket: "improved" as const, path: seg(oak[3]!, river[4]!, 6) },
          ...(mode === "demo" || mode === "demoCompleted"
            ? [{ osmId: "way/1000000000004", bucket: "started" as const, path: willow }]
            : []),
        ]
      : [];

  const pad = 0.0015;
  return {
    success: true,
    runs: [{ activityId: "strava-act-demo-7f3a", path: runPath }],
    streets,
    bbox: {
      south: lat0 - d - pad,
      north: lat0 + d + pad,
      west: lng0 - d - pad,
      east: lng0 + d + pad,
    },
  };
}

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
      "--- Street Keeper ---\n" +
      "Long miles, big map moves — \"Downtown grid\" felt every step.\n\n" +
      "10.2 km · 52m · 42% → 48%\n\n" +
      "Completed: Oak Avenue, Maple Lane\n\n" +
      "Started: River Road\n\n" +
      "Improved: Cedar Street\n\n" +
      "#StreetKeeper #RunEveryStreet #LongRun",
    createdAt: baseTime,
    ...overrides,
  };
}

export function getDemoCelebrationFixture(mode: DemoCelebrationMode): PendingCelebrationBatch {
  const projectCompleted = mode === "demoCompleted";
  const longRun = mode === "demoLongRun";
  const morning = mode === "demoMorning";

  const distance = longRun ? 12_500 : 10234;
  const startDate = morning ? morningTime : baseTime;

  const shareMsgA =
    "--- Street Keeper ---\n" +
    (longRun
      ? "Serious distance on the legs; \"Downtown grid\" shifted (42% → 48%).\n\n12.5 km · 52m\n\n"
      : morning
        ? "Early light, early wins — \"Downtown grid\" before the city woke up.\n\n10.2 km · 52m · 42% → 48%\n\n"
        : "New streets finished in \"Downtown grid\" — momentum is real.\n\n10.2 km · 52m · 42% → 48%\n\n") +
    "Completed: Oak Avenue, Maple Lane\n\n" +
    "Started: River Road\n\n" +
    "Improved: Cedar Street\n\n" +
    (longRun
      ? "#StreetKeeper #RunEveryStreet #LongRun"
      : morning
        ? "#StreetKeeper #RunEveryStreet #MorningRun"
        : "#StreetKeeper #RunEveryStreet");

  const events: PendingCelebrationEventDto[] = [
    makeEvent({
      id: "00000000-0000-4000-8000-000000000001",
      activityId: "strava-act-demo-7f3a",
      projectId: "00000000-0000-4000-8000-0000000000a1",
      projectName: "Downtown grid",
      activityDistanceMeters: distance,
      activityStartDate: startDate,
      completedStreetNames: ["Oak Avenue", "Maple Lane"],
      startedStreetNames: ["River Road"],
      improvedStreetNames: ["Cedar Street"],
      projectProgressBefore: 42,
      projectProgressAfter: projectCompleted ? 100 : 48,
      projectCompleted,
      shareMessage: shareMsgA,
    }),
    makeEvent({
      id: "00000000-0000-4000-8000-000000000002",
      activityId: "strava-act-demo-7f3a",
      projectId: "00000000-0000-4000-8000-0000000000a2",
      projectName: "Riverside paths",
      activityDistanceMeters: distance,
      activityStartDate: startDate,
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
        "--- Street Keeper ---\n" +
        "Exploration run: \"Riverside paths\" grew to 18%.\n\n" +
        `${(distance / 1000).toFixed(1)} km · 52m\n\n` +
        "Started: Willow Walk, Bridge Approach\n\n" +
        (longRun
          ? "#StreetKeeper #RunEveryStreet #LongRun"
          : morning
            ? "#StreetKeeper #RunEveryStreet #MorningRun"
            : "#StreetKeeper #RunEveryStreet"),
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
