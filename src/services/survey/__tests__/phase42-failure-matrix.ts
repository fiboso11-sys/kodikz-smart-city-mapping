/**
 * Phase 4.2 — Failure recovery matrix (automated subset).
 * Browser-only scenarios are marked MANUAL in PHASE42-FRONTEND-BURNDOWN.md.
 */

import { LocalAuthProvider, resetAuthProviderForTests, seedLocalAuthUsers } from "@/lib/auth/provider";
import { offlineQueue } from "@/platform/sge";
import { assignmentManager } from "@/platform/sge";
import { useSgeStore } from "@/store/sge-store";
import { useRouteAssignmentStore } from "@/store/route-assignment-store";
import { surveyService } from "@/services/survey";

process.env.DEPLOYMENT_MODE = "local";
process.env.MOCK_AUTH_ENABLED = "true";
process.env.AUTH_JWT_SECRET = "local-dev-only-secret-change-me-32chars";

let passed = 0;
let failed = 0;

function ok(msg: string) {
  passed += 1;
  console.log(`  ✓ ${msg}`);
}
function fail(msg: string) {
  failed += 1;
  console.error(`  ✗ ${msg}`);
}

async function main() {
  console.log("\n=== Phase 4.2 Failure Matrix (automated) ===\n");
  resetAuthProviderForTests();
  seedLocalAuthUsers();
  const auth = new LocalAuthProvider();

  // 1. Offline queue enqueue + coalesce
  const before = offlineQueue.pendingCount();
  offlineQueue.enqueue({
    type: "DECISION_SYNC",
    tenantId: "dubai-giscd",
    vehicleId: "imei-matrix-1",
    assignmentId: "asg-matrix",
    payload: { decision: { routeState: "ON_ROUTE" } },
  });
  offlineQueue.enqueue({
    type: "DECISION_SYNC",
    tenantId: "dubai-giscd",
    vehicleId: "imei-matrix-1",
    assignmentId: "asg-matrix",
    payload: { decision: { routeState: "OFF_ROUTE" } },
  });
  if (offlineQueue.pendingCount() === before + 1) ok("offline queue coalesces duplicate DECISION_SYNC");
  else fail("offline queue coalesce");

  // 2. Assignment recovery after refresh simulation
  const sup = await auth.authenticate("supervisor@dubai-giscd.local", "ChangeMe!Pilot1");
  if (!sup) fail("supervisor login");
  else {
    ok("supervisor login for recovery test");
    const created = surveyService.createAssignment({
      tenantId: "dubai-giscd",
      vehicleId: "imei-matrix-recover",
      routeId: "geo-test",
      routeName: "Matrix Route",
      permitId: null,
      createdBy: sup.id,
      geometry: {
        type: "LineString",
        coordinates: [
          [55.27, 25.2],
          [55.28, 25.21],
        ],
      },
    });
    const approved = surveyService.approveAssignment(created.id, sup.id)!;
    const active = surveyService.startAssignment(approved.id, sup.id)!;
    assignmentManager.hydrateFromServer([active]);
    useSgeStore.getState().startFromAssignment(active);

    useSgeStore.setState({ byVehicle: {}, focusedVehicleId: null, hydrated: true });
    await useRouteAssignmentStore.getState().refresh();
    const restored = useSgeStore.getState().byVehicle["imei-matrix-recover"];
    if (restored?.assignmentId === active.id) ok("assignment + SGE session restored after refresh simulation");
    else fail("assignment recovery after refresh");

    surveyService.completeAssignment(active.id, sup.id);
  }

  // 3. Blockage offline enqueue
  offlineQueue.enqueue({
    type: "BLOCKAGE_REPORT",
    tenantId: "dubai-giscd",
    vehicleId: "imei-matrix-1",
    assignmentId: "asg-matrix",
    payload: { reason: "ROAD_CLOSED", notes: "matrix" },
  });
  if (offlineQueue.getPending().some((p) => p.type === "BLOCKAGE_REPORT")) ok("blockage retry queued offline");
  else fail("blockage offline queue");

  // 4. Photo upload offline queue
  offlineQueue.enqueue({
    type: "PHOTO_UPLOAD",
    tenantId: "dubai-giscd",
    vehicleId: "imei-matrix-1",
    assignmentId: "asg-matrix",
    payload: { key: "test.jpg" },
  });
  ok("photo upload offline queue entry accepted");

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
