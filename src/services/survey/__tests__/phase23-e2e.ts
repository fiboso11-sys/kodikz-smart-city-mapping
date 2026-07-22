/**
 * Phase 2.3 End-to-End Production Workflow Validation
 * Run: npx tsx src/services/survey/__tests__/phase23-e2e.ts
 *
 * Covers: assign → start → decision → alert → blockage → pause → resume → complete → restore
 */

import { surveyService, subscribeSurveyEvents, getSurveyEventHistory } from "../index";
import type { SurveyDecision } from "../types";
import { getMessages, LOCALE_DIR } from "@/lib/i18n/messages";

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

const GEOM: GeoJSON.LineString = {
  type: "LineString",
  coordinates: [
    [55.27, 25.2048],
    [55.275, 25.2048],
    [55.28, 25.2048],
  ],
};

async function main() {
  console.log("\n=== Phase 2.3 Production E2E ===\n");

  const events: string[] = [];
  const unsub = subscribeSurveyEvents((e) => events.push(e.type));

  // 1. Create + start assignment
  console.log("1. Assignment lifecycle");
  let a = surveyService.createAssignment({
    tenantId: "dubai-giscd",
    vehicleId: "imei-e2e-001",
    routeId: "route-e2e",
    routeName: "Sheikh Zayed Pilot",
    createdBy: "supervisor",
    geometry: GEOM,
  });
  assert(a.status === "DRAFT", "created as DRAFT");
  a = surveyService.approveAssignment(a.id, "supervisor")!;
  assert(a.status === "ASSIGNED", "approved → ASSIGNED");
  a = surveyService.startAssignment(a.id, "driver")!;
  assert(a.status === "ACTIVE", "started → ACTIVE");
  assert(events.includes("survey_assignment_created"), "event: survey_assignment_created");
  assert(events.includes("survey_started"), "event: survey_started");

  // 2. Persist decision (SGE-produced — we only store)
  console.log("2. Decision + notifications");
  const decision: SurveyDecision = {
    id: "dec-e2e-1",
    assignmentId: a.id,
    vehicleId: a.vehicleId,
    tenantId: a.tenantId,
    timestamp: Date.now(),
    routeState: "OFF_ROUTE",
    previousRouteState: "ON_ROUTE",
    completionPct: 12,
    completionStatus: "IN_PROGRESS",
    segmentId: "seg-0",
    nextSegmentId: "seg-1",
    distanceFromRoute: 85,
    headingDifference: 170,
    headingStatus: "WRONG_DIRECTION",
    wrongDirection: true,
    gpsAccuracy: 8,
    speed: 40,
    heading: 90,
    latitude: 25.205,
    longitude: 55.271,
    severity: "CRITICAL",
    voiceEvent: "WRONG_DIRECTION",
    supervisorEvent: "OFF_ROUTE",
    blockage: null,
    alerts: [],
    completedLengthMetres: 100,
    remainingLengthMetres: 800,
    totalLengthMetres: 900,
    currentRoad: null,
  };
  surveyService.saveDecision(decision);
  assert(events.includes("survey_decision_updated"), "event: survey_decision_updated");
  const notes = surveyService.listNotifications(a.tenantId);
  assert(
    notes.some((n) => n.type === "WRONG_DIRECTION"),
    "notification: Wrong Direction"
  );
  assert(notes.some((n) => n.type === "OFF_ROUTE"), "notification: Off Route");

  // 3. Return on route
  console.log("3. Return to route");
  surveyService.saveDecision({
    ...decision,
    id: "dec-e2e-2",
    routeState: "ON_ROUTE",
    previousRouteState: "OFF_ROUTE",
    wrongDirection: false,
    headingStatus: "CORRECT",
    distanceFromRoute: 5,
    timestamp: Date.now() + 1,
  });
  const audit = surveyService.listAudit(a.id);
  assert(audit.some((e) => e.action === "Return"), "audit: Return");

  // 4. Blockage + photo meta
  console.log("4. Blockage");
  surveyService.saveBlockage({
    id: "blk-e2e-1",
    tenantId: a.tenantId,
    assignmentId: a.id,
    vehicleId: a.vehicleId,
    routeId: a.routeId,
    latitude: 25.205,
    longitude: 55.272,
    timestamp: Date.now(),
    reason: "CONSTRUCTION",
    notes: "Lane closed",
    photoIds: ["pho-e2e-1"],
  });
  assert(events.includes("blockage_reported"), "event: blockage_reported");

  surveyService.savePhoto({
    id: "pho-e2e-1",
    tenantId: a.tenantId,
    assignmentId: a.id,
    vehicleId: a.vehicleId,
    blockageId: "blk-e2e-1",
    filename: "block.jpg",
    storedPath: "pho-e2e-1-block.jpg",
    size: 1024,
    contentType: "image/jpeg",
    timestamp: Date.now(),
    latitude: 25.205,
    longitude: 55.272,
  });
  assert(events.includes("survey_photo_uploaded"), "event: survey_photo_uploaded");

  // 5. Supervisor commands
  console.log("5. Supervisor commands");
  const cmd = surveyService.issueCommand("PAUSE", {
    tenantId: a.tenantId,
    assignmentId: a.id,
    vehicleId: a.vehicleId,
    issuedBy: "supervisor",
  });
  assert(cmd.type === "PAUSE", "command PAUSE issued");
  a = surveyService.getAssignment(a.id)!;
  assert(a.status === "PAUSED", "assignment PAUSED");
  assert(events.includes("survey_paused"), "event: survey_paused");

  surveyService.issueCommand("RESUME", {
    tenantId: a.tenantId,
    assignmentId: a.id,
    vehicleId: a.vehicleId,
    issuedBy: "supervisor",
  });
  a = surveyService.getAssignment(a.id)!;
  assert(a.status === "ACTIVE", "assignment RESUMED");

  surveyService.issueCommand("SEND_MESSAGE", {
    tenantId: a.tenantId,
    assignmentId: a.id,
    vehicleId: a.vehicleId,
    issuedBy: "supervisor",
    message: "Proceed carefully",
  });
  assert(events.includes("driver_message"), "event: driver_message");

  // 6. Complete + restore
  console.log("6. Complete + restore");
  a = surveyService.completeAssignment(a.id, "driver")!;
  assert(a.status === "COMPLETED", "completed");
  assert(events.includes("survey_completed"), "event: survey_completed");

  const restored = surveyService.getAssignment(a.id);
  assert(restored?.status === "COMPLETED", "survives get after complete");
  assert(surveyService.listAssignments(a.tenantId).some((x) => x.id === a.id), "list includes assignment");

  const timeline = surveyService.listAudit(a.id);
  assert(timeline.length >= 5, `timeline from audit (${timeline.length} entries)`);

  // 7. Localization
  console.log("7. Localization");
  assert(getMessages("en").wrongDirection === "Wrong Direction", "EN resources");
  assert(getMessages("ar").wrongDirection === "اتجاه خاطئ", "AR resources");
  assert(LOCALE_DIR.ar === "rtl", "AR is RTL");
  assert(LOCALE_DIR.en === "ltr", "EN is LTR");

  // 8. Event history
  console.log("8. Event hub");
  assert(getSurveyEventHistory(20).length > 0, "event history retained");

  unsub();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
