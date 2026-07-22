/**
 * Phase 2.1c — Production Platform Validation
 * Run: npx tsx src/platform/sge/__tests__/platform-validation.ts
 */

import { AssignmentManager } from "../assignment/assignment-manager";
import { SessionManager } from "../session/session-manager";
import { DecisionBus } from "../decision-bus/decision-bus";
import { SgeEventBus } from "../event-bus/event-bus";
import { AlertCenter } from "../alerts/alert-center";
import { OfflineQueue } from "../offline/offline-queue";
import { RoadResolver, PlaceholderRoadProvider } from "../geo/road-resolver";
import type { CreateAssignmentInput } from "../types/assignment";
import type { GpsPoint } from "@/engines/sge";
import { resetSgeConfig } from "@/engines/sge";

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

const ROUTE_GEOM: GeoJSON.LineString = {
  type: "LineString",
  coordinates: [
    [55.27, 25.2048],
    [55.272, 25.2048],
    [55.274, 25.2048],
    [55.276, 25.2048],
    [55.278, 25.2048],
    [55.28, 25.2048],
  ],
};

function makeInput(vehicleId: string, routeId: string): CreateAssignmentInput {
  return {
    tenantId: "dubai-giscd",
    vehicleId,
    routeId,
    routeName: `Route ${routeId}`,
    createdBy: "test",
    geometry: ROUTE_GEOM,
  };
}

function gps(lon: number, overrides: Partial<GpsPoint> = {}): GpsPoint {
  return {
    latitude: 25.2048,
    longitude: lon,
    accuracy: 5,
    speed: 30,
    heading: 90,
    timestamp: Date.now(),
    ...overrides,
  };
}

function testAssignmentLifecycle(): void {
  console.log("\n--- Assignment Manager Lifecycle ---");
  const am = new AssignmentManager();
  const draft = am.create(makeInput("v-1", "r-1"));
  assert(draft.status === "DRAFT", "Creates DRAFT assignment");

  const assigned = am.assignVehicle(draft.id, "v-1");
  assert(assigned?.status === "ASSIGNED", "Assign vehicle → ASSIGNED");

  const started = am.startSurvey(draft.id);
  assert(started?.status === "ACTIVE", "Start survey → ACTIVE");
  assert(started?.actualStart != null, "Records actualStart");

  const paused = am.pauseSurvey(draft.id);
  assert(paused?.status === "PAUSED", "Pause → PAUSED");

  const resumed = am.resumeSurvey(draft.id);
  assert(resumed?.status === "ACTIVE", "Resume → ACTIVE");

  const completed = am.completeSurvey(draft.id);
  assert(completed?.status === "COMPLETED", "Complete → COMPLETED");
}

function testMultiSessionIsolation(): void {
  console.log("\n--- Multi-Session Isolation ---");
  resetSgeConfig();
  const am = new AssignmentManager();
  const sm = new SessionManager();
  const bus = new DecisionBus();

  const a1 = am.create(makeInput("veh-A", "r-a"));
  am.assignVehicle(a1.id, "veh-A");
  am.startSurvey(a1.id);
  sm.startSession(am.getById(a1.id)!);

  const a2 = am.create(makeInput("veh-B", "r-b"));
  am.assignVehicle(a2.id, "veh-B");
  am.startSurvey(a2.id);
  sm.startSession(am.getById(a2.id)!);

  assert(sm.getActiveVehicleIds().length === 2, "Two independent sessions");
  assert(sm.getSession("veh-A") !== sm.getSession("veh-B"), "Sessions are distinct objects");

  const d1 = sm.feedGps("veh-A", gps(55.27));
  const d2 = sm.feedGps("veh-B", gps(55.28, { timestamp: Date.now() + 1 }));

  assert(d1 != null && d2 != null, "Both vehicles produce decisions");
  assert(d1!.vehicleId === "veh-A" && d2!.vehicleId === "veh-B", "No cross-vehicle leakage");
  assert(d1!.assignmentId !== d2!.assignmentId, "Assignment isolation");

  bus.publish(d1!);
  bus.publish(d2!);
  assert(bus.getLatest("veh-A")?.vehicleId === "veh-A", "Decision bus keyed by vehicle");
  assert(bus.getLatest("veh-B")?.vehicleId === "veh-B", "Decision bus keyed by vehicle B");
}

function testDecisionAndEventBus(): void {
  console.log("\n--- Decision Bus + Event Bus ---");
  const events: string[] = [];
  const eventBus = new SgeEventBus();
  eventBus.subscribe("*", (e) => events.push(e.type));

  eventBus.publish({
    type: "SURVEY_STARTED",
    timestamp: Date.now(),
    tenantId: "dubai-giscd",
    vehicleId: "v-1",
    assignmentId: "a-1",
    severity: "INFO",
    payload: {},
  });
  eventBus.publish({
    type: "OFF_ROUTE",
    timestamp: Date.now(),
    tenantId: "dubai-giscd",
    vehicleId: "v-1",
    assignmentId: "a-1",
    severity: "CRITICAL",
    payload: {},
  });

  assert(events.includes("SURVEY_STARTED"), "Event bus delivers SURVEY_STARTED");
  assert(events.includes("OFF_ROUTE"), "Event bus delivers OFF_ROUTE");
  assert(eventBus.getHistory().length === 2, "Event history retained");
}

function testAlertCenter(): void {
  console.log("\n--- Alert Center ---");
  // Use isolated event bus by creating AlertCenter after publishing via its own bus
  // AlertCenter uses singleton sgeEventBus — create alerts directly
  const ac = new AlertCenter();
  const alert = ac.create({
    tenantId: "dubai-giscd",
    assignmentId: "a-1",
    vehicleId: "v-1",
    severity: "CRITICAL",
    category: "ROUTE_DEVIATION",
    message: "Off route",
  });
  assert(alert.status === "OPEN", "Alert created OPEN");

  const ack = ac.acknowledge(alert.id, "supervisor");
  assert(ack?.status === "ACKNOWLEDGED", "Alert acknowledged");
  assert(ack?.acknowledgedBy === "supervisor", "Acknowledged by recorded");

  const csv = ac.exportCsv();
  assert(csv.includes("id,vehicleId"), "CSV export has header");

  ac.dispose();
}

function testOfflineQueue(): void {
  console.log("\n--- Offline Queue ---");
  const q = new OfflineQueue();
  let synced = 0;
  q.setSyncHandler(async () => {
    synced++;
    return true;
  });

  q.enqueue({
    type: "BLOCKAGE_REPORT",
    tenantId: "dubai-giscd",
    vehicleId: "v-1",
    assignmentId: "a-1",
    payload: { reason: "ROAD_CLOSED" },
  });

  assert(q.getPending().length >= 1, "Offline item queued");
}

function testRoadResolverCache(): void {
  console.log("\n--- Road Resolver Cache ---");
  const resolver = new RoadResolver(new PlaceholderRoadProvider());
  // First resolve
  // sync peek empty
  assert(resolver.peek(25.2048, 55.27) === null, "Cache miss initially");
}

function testTenantIsolation(): void {
  console.log("\n--- Tenant Isolation ---");
  const am = new AssignmentManager();
  const a = am.create({ ...makeInput("v-t1", "r-t"), tenantId: "tenant-a" });
  am.create({ ...makeInput("v-t2", "r-t2"), tenantId: "tenant-b" });

  const onlyA = am.getAll("tenant-a");
  assert(onlyA.every((x) => x.tenantId === "tenant-a"), "getAll filters by tenant");
  assert(onlyA.some((x) => x.id === a.id), "Tenant A sees its assignment");
}

function testGpsScenarios(): void {
  console.log("\n--- GPS Scenarios (loss, wrong direction, completion path) ---");
  resetSgeConfig();
  const am = new AssignmentManager();
  const sm = new SessionManager();

  const a = am.create(makeInput("v-gps", "r-gps"));
  am.assignVehicle(a.id, "v-gps");
  am.startSurvey(a.id);
  sm.startSession(am.getById(a.id)!);

  let now = Date.now();
  let d = sm.feedGps("v-gps", gps(55.27, { timestamp: now }));
  assert(d?.routeState === "ON_ROUTE", "Normal route → ON_ROUTE");

  now += 2000;
  d = sm.feedGps("v-gps", gps(55.274, { timestamp: now, accuracy: 55 }));
  assert(d?.routeState === "GPS_UNRELIABLE", "Poor GPS → GPS_UNRELIABLE");

  now += 2000;
  d = sm.feedGps("v-gps", gps(55.274, { timestamp: now, accuracy: 5 }));
  assert(d?.routeState !== "GPS_UNRELIABLE", "GPS recovery");

  // Wrong direction sustained
  for (let i = 0; i < 6; i++) {
    now += 1000;
    d = sm.feedGps(
      "v-gps",
      gps(55.274 - i * 0.0001, { timestamp: now, heading: 270, speed: 30 })
    );
  }
  assert(d?.wrongDirection === true || d?.headingStatus === "WRONG_DIRECTION", "Wrong direction detected");
}

console.log("╔══════════════════════════════════════════════════╗");
console.log("║  Phase 2.1c Platform — Production Validation     ║");
console.log("╚══════════════════════════════════════════════════╝");

testAssignmentLifecycle();
testMultiSessionIsolation();
testDecisionAndEventBus();
testAlertCenter();
testOfflineQueue();
testRoadResolverCache();
testTenantIsolation();
testGpsScenarios();

console.log("\n══════════════════════════════════════════════════");
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed === 0) {
  console.log("✅ ALL PLATFORM TESTS PASSED");
} else {
  console.log("❌ SOME PLATFORM TESTS FAILED");
  process.exit(1);
}
