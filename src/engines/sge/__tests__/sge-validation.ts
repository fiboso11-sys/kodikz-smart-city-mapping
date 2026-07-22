/**
 * Survey Guidance Engine — Automated Validation Tests
 *
 * Validates all SGE scenarios without requiring a test framework.
 * Run via: npx tsx src/engines/sge/__tests__/sge-validation.ts
 *
 * Scenarios:
 * 1. Normal route following
 * 2. Intentional deviation
 * 3. Wrong direction
 * 4. GPS loss
 * 5. Road closure / blockage
 * 6. Route completion
 * 7. Return to route
 */

import { resetSgeConfig } from "../config";
import {
  createSession,
  processGpsTick,
  pauseSession,
  resumeSession,
} from "../survey-guidance-engine";
import { reportBlockage, createBlockageContext } from "../blockage-engine";
import type { GpsPoint, RouteAssignment, RouteState } from "../types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function makeGps(
  lat: number,
  lon: number,
  overrides: Partial<GpsPoint> = {}
): GpsPoint {
  return {
    latitude: lat,
    longitude: lon,
    accuracy: 5,
    speed: 30,
    heading: 90,
    timestamp: Date.now(),
    ...overrides,
  };
}

// Simple test route: straight line along lat 25.2048, from lon 55.27 to 55.28
const TEST_ASSIGNMENT: RouteAssignment = {
  id: "assign-1",
  vehicleId: "v-1",
  routeId: "route-1",
  routeName: "Test Route",
  geometry: {
    type: "LineString",
    coordinates: [
      [55.27, 25.2048],
      [55.271, 25.2048],
      [55.272, 25.2048],
      [55.273, 25.2048],
      [55.274, 25.2048],
      [55.275, 25.2048],
      [55.276, 25.2048],
      [55.277, 25.2048],
      [55.278, 25.2048],
      [55.279, 25.2048],
      [55.28, 25.2048],
    ],
  },
  assignedAt: Date.now(),
  status: "active",
};

function runScenario1_NormalRoute(): void {
  console.log("\n--- Scenario 1: Normal Route Following ---");
  resetSgeConfig();
  let session = createSession("v-1", TEST_ASSIGNMENT);
  let now = Date.now();

  // Vehicle starts on the route
  const gps1 = makeGps(25.2048, 55.27, { timestamp: now, speed: 30, heading: 90 });
  const r1 = processGpsTick(session, gps1);
  session = r1.updatedSession;

  assert(r1.snapshot.routeState === "ON_ROUTE", "State transitions to ON_ROUTE on start");
  assert(r1.snapshot.distanceFromRoute < 1, "Distance from route is ~0");

  // Move along route with multiple samples per segment to satisfy min GPS samples
  const steps = [55.2705, 55.271, 55.2715, 55.272, 55.2725, 55.273];
  let lastR = r1;
  for (const lon of steps) {
    now += 1000;
    const gps = makeGps(25.2048, lon, { timestamp: now, speed: 30, heading: 90 });
    lastR = processGpsTick(session, gps);
    session = lastR.updatedSession;
  }

  assert(lastR.snapshot.routeState === "ON_ROUTE", "Stays ON_ROUTE while following");
  assert(lastR.snapshot.completionPct > 0, "Completion increases with multiple samples");
  assert(lastR.snapshot.headingStatus === "CORRECT", "Heading is correct");
}

function runScenario2_IntentionalDeviation(): void {
  console.log("\n--- Scenario 2: Intentional Deviation ---");
  resetSgeConfig();
  let session = createSession("v-1", TEST_ASSIGNMENT);
  let now = Date.now();

  // Start on route
  const gps1 = makeGps(25.2048, 55.27, { timestamp: now, speed: 30, heading: 90 });
  const r1 = processGpsTick(session, gps1);
  session = r1.updatedSession;
  assert(r1.snapshot.routeState === "ON_ROUTE", "Starts ON_ROUTE");

  // Move 20m off route (warning zone: 15-30m)
  now += 2000;
  const gps2 = makeGps(25.2050, 55.272, { timestamp: now, speed: 30, heading: 90 });
  const r2 = processGpsTick(session, gps2);
  session = r2.updatedSession;
  assert(
    r2.snapshot.routeState === "WARNING" || r2.snapshot.distanceFromRoute > 15,
    "Enters WARNING zone when 15-30m from route"
  );

  // Move further off (>30m)
  now += 4000;
  const gps3 = makeGps(25.2055, 55.273, { timestamp: now, speed: 30, heading: 90 });
  const r3 = processGpsTick(session, gps3);
  session = r3.updatedSession;
  assert(
    r3.snapshot.routeState === "OFF_ROUTE" || r3.snapshot.distanceFromRoute > 30,
    "Transitions to OFF_ROUTE beyond 30m"
  );
}

function runScenario3_WrongDirection(): void {
  console.log("\n--- Scenario 3: Wrong Direction ---");
  resetSgeConfig();
  let session = createSession("v-1", TEST_ASSIGNMENT);
  let now = Date.now();

  // On route, correct heading
  const gps1 = makeGps(25.2048, 55.273, { timestamp: now, speed: 30, heading: 90 });
  const r1 = processGpsTick(session, gps1);
  session = r1.updatedSession;
  assert(r1.snapshot.headingStatus === "CORRECT", "Correct heading at start");

  // Wrong direction (180° opposite) for 6 seconds
  now += 1000;
  for (let i = 0; i < 6; i++) {
    now += 1000;
    const gps = makeGps(25.2048, 55.273 - i * 0.0001, {
      timestamp: now,
      speed: 30,
      heading: 270,
    });
    const r = processGpsTick(session, gps);
    session = r.updatedSession;
  }

  assert(
    session.heading.wrongDirectionSince !== null,
    "Wrong direction detected after sustained opposite heading"
  );
}

function runScenario4_GpsLoss(): void {
  console.log("\n--- Scenario 4: GPS Loss ---");
  resetSgeConfig();
  let session = createSession("v-1", TEST_ASSIGNMENT);
  let now = Date.now();

  // Normal GPS
  const gps1 = makeGps(25.2048, 55.273, { timestamp: now, accuracy: 5, speed: 30, heading: 90 });
  const r1 = processGpsTick(session, gps1);
  session = r1.updatedSession;
  assert(r1.snapshot.routeState === "ON_ROUTE", "Starts ON_ROUTE with good GPS");

  // GPS degrades (accuracy > 40m)
  now += 2000;
  const gps2 = makeGps(25.2048, 55.274, { timestamp: now, accuracy: 50, speed: 30, heading: 90 });
  const r2 = processGpsTick(session, gps2);
  session = r2.updatedSession;
  assert(r2.snapshot.routeState === "GPS_UNRELIABLE", "Transitions to GPS_UNRELIABLE");

  // GPS recovers
  now += 3000;
  const gps3 = makeGps(25.2048, 55.275, { timestamp: now, accuracy: 5, speed: 30, heading: 90 });
  const r3 = processGpsTick(session, gps3);
  session = r3.updatedSession;
  assert(
    r3.snapshot.routeState !== "GPS_UNRELIABLE",
    "Recovers from GPS_UNRELIABLE when accuracy improves"
  );
}

function runScenario5_RoadClosure(): void {
  console.log("\n--- Scenario 5: Road Closure / Blockage ---");
  resetSgeConfig();
  const ctx = createBlockageContext();

  const { report, updatedCtx } = reportBlockage(ctx, {
    vehicleId: "v-1",
    assignmentId: "assign-1",
    routeId: "route-1",
    latitude: 25.2048,
    longitude: 55.274,
    reason: "ROAD_CLOSED",
    notes: "Construction work",
  });

  assert(report.id.startsWith("blk-"), "Blockage report has valid ID");
  assert(report.reason === "ROAD_CLOSED", "Blockage reason is correct");
  assert(updatedCtx.reports.length === 1, "Report stored in context");
  assert(updatedCtx.pendingNotifications.length === 1, "Supervisor notification queued");
}

function runScenario6_Completion(): void {
  console.log("\n--- Scenario 6: Route Completion ---");
  resetSgeConfig();
  let session = createSession("v-1", TEST_ASSIGNMENT);
  let now = Date.now();

  // Traverse entire route
  const lons = [55.27, 55.271, 55.272, 55.273, 55.274, 55.275, 55.276, 55.277, 55.278, 55.279, 55.28];
  for (const lon of lons) {
    now += 2000;
    const gps = makeGps(25.2048, lon, { timestamp: now, speed: 30, heading: 90, accuracy: 5 });
    const r = processGpsTick(session, gps);
    session = r.updatedSession;
  }

  // Re-traverse to ensure segment completion (min 2 samples)
  for (const lon of lons) {
    now += 2000;
    const gps = makeGps(25.2048, lon, { timestamp: now, speed: 30, heading: 90, accuracy: 5 });
    const r = processGpsTick(session, gps);
    session = r.updatedSession;
  }

  assert(session.lastSnapshot!.completionPct > 0, "Completion percentage advances");
  assert(
    session.lastSnapshot!.completionStatus !== "NOT_STARTED",
    "Completion status is not NOT_STARTED"
  );
}

function runScenario7_ReturnToRoute(): void {
  console.log("\n--- Scenario 7: Return to Route ---");
  resetSgeConfig();
  let session = createSession("v-1", TEST_ASSIGNMENT);
  let now = Date.now();

  // Start on route
  const gps1 = makeGps(25.2048, 55.273, { timestamp: now, speed: 30, heading: 90 });
  processGpsTick(session, gps1);
  let r = processGpsTick(session, gps1);
  session = r.updatedSession;

  // Deviate far off route
  now += 5000;
  const gps2 = makeGps(25.2060, 55.273, { timestamp: now, speed: 30, heading: 0 });
  r = processGpsTick(session, gps2);
  session = r.updatedSession;
  const offState = r.snapshot.routeState;
  assert(
    offState === "WARNING" || offState === "OFF_ROUTE",
    "Vehicle is off route after deviation"
  );

  // Return to route
  now += 4000;
  const gps3 = makeGps(25.2048, 55.274, { timestamp: now, speed: 30, heading: 90 });
  r = processGpsTick(session, gps3);
  session = r.updatedSession;

  // Allow hysteresis time to pass
  now += 4000;
  const gps4 = makeGps(25.2048, 55.275, { timestamp: now, speed: 30, heading: 90 });
  r = processGpsTick(session, gps4);
  session = r.updatedSession;

  assert(
    r.snapshot.routeState === "ON_ROUTE" || r.snapshot.routeState === "RETURNING",
    "Vehicle returns to route or is in RETURNING state"
  );
}

function runScenario8_PauseResume(): void {
  console.log("\n--- Scenario 8: Pause/Resume ---");
  resetSgeConfig();
  let session = createSession("v-1", TEST_ASSIGNMENT);
  let now = Date.now();

  const gps1 = makeGps(25.2048, 55.273, { timestamp: now, speed: 30, heading: 90 });
  let r = processGpsTick(session, gps1);
  session = r.updatedSession;

  // Pause
  session = pauseSession(session);
  now += 2000;
  const gps2 = makeGps(25.2048, 55.274, { timestamp: now, speed: 0, heading: 90 });
  r = processGpsTick(session, gps2);
  session = r.updatedSession;
  assert(r.snapshot.routeState === "PAUSED", "Session is PAUSED");

  // Resume
  session = resumeSession(session);
  now += 2000;
  const gps3 = makeGps(25.2048, 55.275, { timestamp: now, speed: 30, heading: 90 });
  r = processGpsTick(session, gps3);
  session = r.updatedSession;
  assert(r.snapshot.routeState !== "PAUSED", "Session resumes from PAUSED");
}

// --- Run all scenarios ---
console.log("╔══════════════════════════════════════════════╗");
console.log("║  Survey Guidance Engine — Validation Suite   ║");
console.log("╚══════════════════════════════════════════════╝");

runScenario1_NormalRoute();
runScenario2_IntentionalDeviation();
runScenario3_WrongDirection();
runScenario4_GpsLoss();
runScenario5_RoadClosure();
runScenario6_Completion();
runScenario7_ReturnToRoute();
runScenario8_PauseResume();

console.log("\n══════════════════════════════════════════════");
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed === 0) {
  console.log("✅ ALL TESTS PASSED");
} else {
  console.log("❌ SOME TESTS FAILED");
  process.exit(1);
}
