/**
 * Phase 3 API authorization certification (in-process, no HTTP server required).
 * Validates permission matrix + tenant isolation + transition rules.
 * Run: pnpm test:api-auth
 */

import { hasPermission, PERMISSIONS, type RoleCode } from "../permissions";
import { assertSameTenant, buildAuthContext } from "../context";
import { canTransition } from "@/services/survey/assignment-lifecycle";
import { resolveDbBackend } from "@/lib/db/backend";
import { loadAppConfig } from "@/lib/config/app-config";

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

const PROTECTED: Array<{ path: string; perm: string; roles: RoleCode[] }> = [
  { path: "GET /api/survey-assignments", perm: PERMISSIONS.SURVEYS_VIEW, roles: ["SUPERVISOR", "DRIVER", "VIEWER"] },
  { path: "POST /api/survey-assignments", perm: PERMISSIONS.ASSIGNMENTS_CREATE, roles: ["SUPERVISOR", "TENANT_ADMIN"] },
  { path: "POST .../start", perm: PERMISSIONS.ASSIGNMENTS_START, roles: ["SUPERVISOR", "DRIVER"] },
  { path: "POST .../pause", perm: PERMISSIONS.ASSIGNMENTS_PAUSE, roles: ["SUPERVISOR", "DRIVER"] },
  { path: "POST /api/survey-commands", perm: PERMISSIONS.COMMANDS_SEND, roles: ["SUPERVISOR"] },
  { path: "POST /api/blockages", perm: PERMISSIONS.BLOCKAGES_CREATE, roles: ["DRIVER"] },
  { path: "GET /api/blockages", perm: PERMISSIONS.BLOCKAGES_VIEW, roles: ["SUPERVISOR", "DRIVER", "VIEWER"] },
  { path: "GET /api/survey-audit", perm: PERMISSIONS.AUDIT_VIEW, roles: ["SUPERVISOR", "VIEWER"] },
  { path: "POST /api/attachments", perm: PERMISSIONS.ATTACHMENTS_UPLOAD, roles: ["DRIVER"] },
  { path: "GET /api/attachments", perm: PERMISSIONS.ATTACHMENTS_VIEW, roles: ["SUPERVISOR", "DRIVER"] },
  { path: "GET /api/survey-timeline", perm: PERMISSIONS.AUDIT_VIEW, roles: ["SUPERVISOR"] },
];

function main() {
  console.log("\n=== Phase 3 API Auth Certification ===\n");

  console.log("1. Deployment config (local)");
  const cfg = loadAppConfig(true);
  assert(cfg.deploymentMode === "local", "DEPLOYMENT_MODE=local");
  assert(cfg.database.allowSqlite === true, "SQLite allowed only in local");
  assert(resolveDbBackend() === "sqlite" || resolveDbBackend() === "memory" || resolveDbBackend() === "postgres", "backend resolves");

  console.log("2. Permission matrix for protected routes");
  for (const row of PROTECTED) {
    for (const role of row.roles) {
      assert(hasPermission([role], row.perm as never), `${role} → ${row.path}`);
    }
  }
  assert(!hasPermission(["VIEWER"], PERMISSIONS.COMMANDS_SEND), "VIEWER blocked from commands");
  assert(!hasPermission(["DRIVER"], PERMISSIONS.COMMANDS_SEND), "DRIVER blocked from commands");
  assert(!hasPermission(["SUPERVISOR"], PERMISSIONS.BLOCKAGES_CREATE), "SUPERVISOR does not create blockages (driver only)");
  assert(!hasPermission(["VIEWER"], PERMISSIONS.ATTACHMENTS_UPLOAD), "VIEWER cannot upload");
  assert(hasPermission(["SUPERVISOR"], PERMISSIONS.ATTACHMENTS_VIEW), "SUPERVISOR can view attachments");
  assert(hasPermission(["SUPERVISOR"], PERMISSIONS.BLOCKAGES_VIEW), "SUPERVISOR can view blockages");

  console.log("3. Tenant isolation helpers");
  const ctx = buildAuthContext({
    userId: "u1",
    tenantId: "dubai-giscd",
    roles: ["SUPERVISOR"],
    sessionId: "s1",
    requestId: "r1",
  });
  let blocked = false;
  try {
    assertSameTenant(ctx, "other-tenant");
  } catch {
    blocked = true;
  }
  assert(blocked, "cross-tenant blocked");
  assertSameTenant(ctx, "dubai-giscd");
  assert(true, "same-tenant allowed");

  console.log("4. Assignment state machine");
  assert(canTransition("ASSIGNED", "ACTIVE"), "ASSIGNED→ACTIVE");
  assert(canTransition("ACTIVE", "PAUSED"), "ACTIVE→PAUSED");
  assert(!canTransition("COMPLETED", "ACTIVE"), "COMPLETED↛ACTIVE");
  assert(!canTransition("CANCELLED", "PAUSED"), "CANCELLED↛PAUSED");

  console.log("5. Pilot mode refuses silent SQLite");
  process.env.DEPLOYMENT_MODE = "pilot";
  delete process.env.DATABASE_URL;
  let threw = false;
  try {
    loadAppConfig(true);
  } catch {
    threw = true;
  }
  assert(threw, "pilot without DATABASE_URL fails closed");

  // restore local for subsequent tests in same process
  process.env.DEPLOYMENT_MODE = "local";
  loadAppConfig(true);

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
