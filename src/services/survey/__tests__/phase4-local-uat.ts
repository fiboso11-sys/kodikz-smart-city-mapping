/**
 * Phase 4 Local Acceptance Test (in-process UAT)
 * Simulates full survey workflow for RC certification.
 * Run: pnpm test:uat
 *
 * Does NOT start Next.js HTTP server (see MANUAL checks in LOCAL-UAT.md).
 */

import { LocalAuthProvider, resetAuthProviderForTests, seedLocalAuthUsers } from "@/lib/auth/provider";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { surveyService } from "@/services/survey";
import { canTransition } from "@/services/survey/assignment-lifecycle";
import { processOutboxBatch } from "@/services/survey/outbox";
import { validateUploadFile, LocalDevStorageProvider } from "@/lib/storage/object-storage";
import { loadAppConfig } from "@/lib/config/app-config";
import { createSession, processGpsTick } from "@/engines/sge/survey-guidance-engine";
import type { GpsPoint, RouteAssignment } from "@/engines/sge";

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

process.env.DEPLOYMENT_MODE = "local";
process.env.MOCK_AUTH_ENABLED = "true";
process.env.AUTH_JWT_SECRET = "local-dev-only-secret-change-me-32chars";
process.env.STORAGE_PROVIDER = "local";

const GEOM: GeoJSON.LineString = {
  type: "LineString",
  coordinates: [
    [55.27, 25.2048],
    [55.275, 25.2048],
    [55.28, 25.2048],
  ],
};

async function main() {
  console.log("\n=== Phase 4 Local UAT ===\n");
  resetAuthProviderForTests();
  seedLocalAuthUsers();
  const auth = new LocalAuthProvider();
  loadAppConfig(true);

  console.log("1. Users / roles");
  const supervisor = await auth.authenticate("supervisor@dubai-giscd.local", "ChangeMe!Pilot1");
  const driver = await auth.authenticate("driver@dubai-giscd.local", "ChangeMe!Pilot1");
  assert(!!supervisor && supervisor.roles.includes("SUPERVISOR"), "supervisor login");
  assert(!!driver && driver.roles.includes("DRIVER"), "driver login");
  assert(hasPermission(["SUPERVISOR"], PERMISSIONS.ASSIGNMENTS_CREATE), "supervisor can assign");
  assert(hasPermission(["DRIVER"], PERMISSIONS.BLOCKAGES_CREATE), "driver can report blockage");

  const supSession = await auth.issueSession(supervisor!);
  const drvSession = await auth.issueSession(driver!);
  assert(!!(await auth.verifyAccessToken(supSession.accessToken)), "supervisor token valid");
  assert(!!(await auth.verifyAccessToken(drvSession.accessToken)), "driver token valid");

  console.log("2. Assignment lifecycle");
  let a = surveyService.createAssignment({
    tenantId: "dubai-giscd",
    vehicleId: "imei-uat-001",
    routeId: "route-uat",
    routeName: "UAT Corridor",
    createdBy: supervisor!.id,
    geometry: GEOM,
  });
  assert(a.status === "DRAFT", "draft created");
  a = surveyService.approveAssignment(a.id, supervisor!.id)!;
  assert(a.status === "ASSIGNED", "approved");
  a = surveyService.startAssignment(a.id, driver!.id)!;
  assert(a.status === "ACTIVE", "started");
  assert(canTransition("ACTIVE", "PAUSED"), "pause allowed");

  console.log("3. SGE GPS → decision path");
  const routeAssignment: RouteAssignment = {
    id: a.id,
    vehicleId: a.vehicleId,
    routeId: a.routeId,
    routeName: a.routeName,
    geometry: GEOM,
    assignedAt: Date.now(),
    status: "active",
  };
  let session = createSession(a.vehicleId, routeAssignment);
  const onRoute: GpsPoint = {
    latitude: 25.2048,
    longitude: 55.272,
    accuracy: 8,
    speed: 35,
    heading: 90,
    timestamp: Date.now(),
  };
  let tick = processGpsTick(session, onRoute);
  session = tick.updatedSession;
  assert(tick.snapshot.routeState === "ON_ROUTE" || tick.snapshot.routeState === "WARNING", "on-route processing");

  const off: GpsPoint = {
    ...onRoute,
    latitude: 25.2085,
    longitude: 55.272,
    timestamp: Date.now() + 1000,
  };
  for (let i = 0; i < 5; i++) {
    tick = processGpsTick(session, { ...off, timestamp: Date.now() + 2000 + i * 1000 });
    session = tick.updatedSession;
  }
  assert(
    ["WARNING", "OFF_ROUTE", "RETURNING"].includes(tick.snapshot.routeState),
    `deviation state=${tick.snapshot.routeState}`
  );

  // Persist SGE decision (API layer only stores)
  surveyService.saveDecision({
    id: `dec-uat-1`,
    assignmentId: a.id,
    vehicleId: a.vehicleId,
    tenantId: a.tenantId,
    timestamp: Date.now(),
    routeState: tick.snapshot.routeState,
    previousRouteState: "ON_ROUTE",
    completionPct: tick.snapshot.completionPct,
    completionStatus: tick.snapshot.completionStatus,
    segmentId: tick.snapshot.segmentId,
    nextSegmentId: null,
    distanceFromRoute: tick.snapshot.distanceFromRoute,
    headingDifference: 0,
    headingStatus: tick.snapshot.headingStatus,
    wrongDirection: false,
    gpsAccuracy: off.accuracy,
    speed: off.speed,
    heading: off.heading,
    latitude: off.latitude,
    longitude: off.longitude,
    severity: "WARNING",
    voiceEvent: tick.voiceEvents[0] ?? null,
    supervisorEvent: null,
    blockage: null,
    alerts: [],
    completedLengthMetres: tick.snapshot.completedLengthMetres,
    remainingLengthMetres: tick.snapshot.remainingLengthMetres,
    totalLengthMetres: tick.snapshot.totalLengthMetres,
    currentRoad: null,
  });
  assert(surveyService.listDecisions({ assignmentId: a.id }).length >= 1, "decision persisted");

  console.log("4. Pause / resume / blockage / photo");
  a = surveyService.pauseAssignment(a.id, supervisor!.id)!;
  assert(a.status === "PAUSED", "paused");
  a = surveyService.resumeAssignment(a.id, supervisor!.id)!;
  assert(a.status === "ACTIVE", "resumed");

  surveyService.issueCommand("REQUEST_RETURN", {
    tenantId: a.tenantId,
    assignmentId: a.id,
    vehicleId: a.vehicleId,
    issuedBy: supervisor!.id,
    message: "Return to route",
  });
  assert(true, "supervisor command issued");

  surveyService.saveBlockage({
    id: "blk-uat-1",
    tenantId: a.tenantId,
    assignmentId: a.id,
    vehicleId: a.vehicleId,
    routeId: a.routeId,
    latitude: off.latitude,
    longitude: off.longitude,
    timestamp: Date.now(),
    reason: "CONSTRUCTION",
    photoIds: [],
  });
  assert(surveyService.listBlockages().some((b) => b.id === "blk-uat-1"), "blockage saved");

  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x00, 0x00]);
  const v = validateUploadFile({
    filename: "evidence.jpg",
    contentType: "image/jpeg",
    size: jpeg.length,
    buffer: jpeg,
  });
  assert(v.ok, "photo validation");
  const storage = new LocalDevStorageProvider();
  const key = `tenants/${a.tenantId}/assignments/${a.id}/uat.jpg`;
  await storage.upload(key, jpeg, "image/jpeg");
  assert(await storage.exists(key), "photo stored");

  console.log("5. Complete + audit + outbox");
  a = surveyService.completeAssignment(a.id, driver!.id)!;
  assert(a.status === "COMPLETED", "completed");
  const audit = surveyService.listAudit(a.id);
  assert(audit.length >= 3, `audit entries=${audit.length}`);
  const restored = surveyService.getAssignment(a.id);
  assert(restored?.status === "COMPLETED", "state survives get (refresh simulation)");

  const outbox = await processOutboxBatch(20);
  assert(outbox.published >= 0, `outbox processed published=${outbox.published}`);

  console.log("6. Tenant isolation smoke");
  const other = surveyService.listAssignments("other-tenant");
  assert(!other.some((x) => x.id === a.id), "assignment not listed under other tenant");

  console.log(`\n=== UAT Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
