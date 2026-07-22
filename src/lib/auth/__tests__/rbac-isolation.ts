/**
 * Auth + RBAC + tenant isolation unit tests.
 * Run: npx tsx src/lib/auth/__tests__/rbac-isolation.ts
 */

import { LocalAuthProvider, resetAuthProviderForTests, seedLocalAuthUsers } from "../provider";
import { hasPermission, PERMISSIONS, permissionsForRoles } from "../permissions";
import { assertSameTenant, buildAuthContext } from "../context";
import { applyTransition, canTransition } from "@/services/survey/assignment-lifecycle";
import type { SurveyAssignment } from "@/platform/sge";
import { validateUploadFile, LocalDevStorageProvider, resetObjectStorageForTests } from "@/lib/storage/object-storage";

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

async function main() {
  console.log("\n=== RBAC / Auth / Isolation ===\n");
  resetAuthProviderForTests();
  seedLocalAuthUsers();
  const auth = new LocalAuthProvider();

  console.log("1. Authentication");
  const bad = await auth.authenticate("supervisor@dubai-giscd.local", "wrong");
  assert(bad == null, "rejects bad password");
  const user = await auth.authenticate("supervisor@dubai-giscd.local", "ChangeMe!Pilot1");
  assert(!!user && user.roles.includes("SUPERVISOR"), "supervisor login");
  const session = await auth.issueSession(user!);
  const ctx = await auth.verifyAccessToken(session.accessToken);
  assert(!!ctx && ctx.tenantId === "dubai-giscd", "JWT verifies tenant");
  await auth.revokeSession(session.sessionId);
  const revoked = await auth.verifyAccessToken(session.accessToken);
  assert(revoked == null, "revoked session rejected");

  console.log("2. Permissions");
  assert(hasPermission(["VIEWER"], PERMISSIONS.SURVEYS_VIEW), "viewer can view");
  assert(!hasPermission(["VIEWER"], PERMISSIONS.ASSIGNMENTS_CREATE), "viewer cannot create");
  assert(hasPermission(["DRIVER"], PERMISSIONS.BLOCKAGES_CREATE), "driver can report blockage");
  assert(!hasPermission(["DRIVER"], PERMISSIONS.COMMANDS_SEND), "driver cannot send commands");
  assert(hasPermission(["SUPERVISOR"], PERMISSIONS.COMMANDS_SEND), "supervisor can command");
  assert(permissionsForRoles(["TENANT_ADMIN"]).has(PERMISSIONS.USERS_MANAGE), "tenant admin manages users");

  console.log("3. Tenant isolation");
  const a = buildAuthContext({
    userId: "u1",
    tenantId: "dubai-giscd",
    roles: ["SUPERVISOR"],
    sessionId: "s1",
    requestId: "r1",
  });
  let blocked = false;
  try {
    assertSameTenant(a, "other-tenant");
  } catch {
    blocked = true;
  }
  assert(blocked, "cross-tenant assert throws");

  console.log("4. Assignment transitions");
  assert(canTransition("DRAFT", "ASSIGNED"), "DRAFT→ASSIGNED");
  assert(!canTransition("COMPLETED", "ACTIVE"), "COMPLETED↛ACTIVE");
  assert(!canTransition("CANCELLED", "ACTIVE"), "CANCELLED↛ACTIVE");
  const base: SurveyAssignment = {
    id: "asg-1",
    tenantId: "dubai-giscd",
    vehicleId: "v1",
    driverId: null,
    routeId: "r1",
    routeName: "R",
    permitId: null,
    surveyType: "STREET_MAPPING",
    priority: "NORMAL",
    plannedStart: null,
    plannedEnd: null,
    actualStart: null,
    actualEnd: null,
    status: "ACTIVE",
    createdBy: "u",
    approvedBy: "u",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    geometry: { type: "LineString", coordinates: [[55.27, 25.2], [55.28, 25.2]] },
  };
  const paused = applyTransition({ ...base, version: 1 }, "PAUSED", "sup");
  assert(paused.status === "PAUSED" && paused.version === 2, "pause bumps version");
  let conflict = false;
  try {
    applyTransition({ ...paused, version: 2 }, "ACTIVE", "sup", 1);
  } catch {
    conflict = true;
  }
  assert(conflict, "optimistic concurrency conflict detected");

  console.log("5. Attachment validation");
  resetObjectStorageForTests();
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x00, 0x00]);
  const ok = validateUploadFile({
    filename: "../../etc/passwd.jpg",
    contentType: "image/jpeg",
    size: jpeg.length,
    buffer: jpeg,
  });
  assert(ok.ok && !ok.ok === false && ok.ok && ok.safeFilename === "passwd.jpg", "path traversal sanitized");
  const badMime = validateUploadFile({
    filename: "x.exe",
    contentType: "application/octet-stream",
    size: 10,
    buffer: Buffer.alloc(10),
  });
  assert(!badMime.ok, "rejects non-image mime");

  const storage = new LocalDevStorageProvider();
  const uploaded = await storage.upload("tenants/dubai-giscd/test.jpg", jpeg, "image/jpeg");
  assert(uploaded.size === jpeg.length, "local storage upload");
  const exists = await storage.exists("tenants/dubai-giscd/test.jpg");
  assert(exists, "local storage exists");

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
