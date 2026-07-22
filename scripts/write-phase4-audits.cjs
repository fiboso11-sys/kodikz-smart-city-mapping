const fs = require("fs");

function w(name, body) {
  fs.writeFileSync(name, body.trim() + "\n");
  console.log("wrote", name);
}

w(
  "SOURCE-CODE-AUDIT.md",
  `# Source Code Audit — Phase 4 RC

**Branch:** phase2/dubai-giscd-enhancements  
**Method:** Static search + test execution  
**Date:** 2026-07-16

## Summary

| Finding | Severity | Status |
|---------|----------|--------|
| No TODO/FIXME in \`src/\` | — | PASS |
| No hardcoded password literals in app code (seed hash only) | WARNING | Documented — rotate on pilot |
| Default GPS URL fallback in config | WARNING | Overridable via env; required for local defaults |
| console.log in test harnesses / structured logger | INFO | Acceptable |
| debugger statements | — | PASS (none found) |
| Unused \`@types/bcryptjs\` | LOW | **FIXED** (removed) |
| Phase 1 vehicle/permit APIs unauthenticated | WARNING | Intentional Phase 1 contract — do not break |
| survey-photos re-exports attachments (auth via handlers) | INFO | OK |
| Large documentation corpus (overlapping FINAL/PHASE docs) | WARNING | Consistent enough; cleanup deferred (no doc deletion) |

## Dead code / duplicates

- Survey domain uses single service + repository path; SGE remains sole decision calculator.
- Dual photo routes: \`/api/attachments\` (canonical) and \`/api/survey-photos\` (alias) — documented, not duplicate logic.
- No circular dependency failures in \`pnpm type-check\` / build.

## Classification

- Critical issues requiring code change before RC handoff: **none verified beyond known infra blockers**
- Warnings: Phase 1 open APIs, seed password, default GPS host, doc sprawl
`
);

w(
  "ARCHITECTURE-AUDIT.md",
  `# Architecture Audit — Phase 4 RC

## Layering

| Layer | Responsibility | Verdict |
|-------|----------------|---------|
| SGE (\`src/engines/sge\`) | Survey decisions only | PASS |
| Platform (\`src/platform/sge\`) | Sessions, buses, offline, voice | PASS |
| Services (\`src/services/survey\`) | Persistence, commands, outbox, realtime adapter | PASS |
| Stores | Lightweight façades | PASS |
| UI | Consumes stores/services; no SGE recalculation | PASS |
| Auth / storage / config | Isolated modules | PASS |
| GPS Socket.IO | Isolated LiveGps provider; external backend | PASS |

## Coupling

- Assignment lifecycle isolated from SGE math
- Object storage isolated behind provider interface
- Realtime abstracted (SSE now; Socket.IO survey later)
- Configuration centralized in \`app-config.ts\`

## Verdict

**PASS** for modular monolith architecture. No unauthorized business-logic duplication found in UI.
`
);

w(
  "DATABASE-AUDIT.md",
  `# Database Audit — Phase 4 RC

## PostgreSQL design (static)

Source: \`src/lib/db/postgres/schema.ts\`

- Normalized tenants/users/roles/assignments/decisions/alerts/commands/blockages/photos/audit/outbox
- Indexes on tenant, vehicle, assignment, status, outbox pending
- FK relationships defined
- Assignment \`version\` for optimistic concurrency
- Photo **metadata only** (no binaries in DB)
- Timestamps TIMESTAMPTZ (UTC)

## Mode enforcement

| Mode | SQLite | PostgreSQL |
|------|--------|------------|
| local | allowed | optional |
| pilot/municipality | **forbidden** (fail closed) | required |

Verified by \`pnpm test:api-auth\` (pilot without DATABASE_URL fails).

## Migration / backup

Scripts present: migrate, sqlite-to-postgres export/import, pg-backup.sh, pg-restore.sh.

| Check | Status |
|-------|--------|
| Schema static review | PASS |
| Live migrate | NOT EXECUTED |
| Backup/restore proof | NOT EXECUTED |

## Verdict

**PASS** (design) / **NOT EXECUTED** (live Postgres operations)
`
);

w(
  "API-AUDIT.md",
  `# API Audit — Phase 4 RC

## Survey APIs (authenticated)

All survey-domain routes use \`withSurveyAuth\` / \`resolveAuthContext\`:

assignments (+ lifecycle), decisions, alerts, progress, history, timeline, audit, notifications, events (SSE), commands, blockages, attachments.

Alias: survey-photos → attachments handlers.

## Phase 1 APIs (open by contract)

vehicles, permits, geo-uploads, gps/*, system-health, health, readiness, auth/login

**WARNING:** Phase 1 CRUD lacks RBAC. Changing this would break Phase 1 public APIs — deferred to coordinated pilot hardening, not RC feature change.

## Checklist (survey)

| Requirement | Status |
|-------------|--------|
| Authentication | PASS |
| Authorization | PASS |
| Tenant isolation | PASS (tests) |
| Input validation | PASS (key paths) |
| Structured errors / requestId | PASS (hardened routes) |
| Rate limits | PASS (login/upload/command/mutation) |
| Audit on lifecycle | PASS (service layer) |

## Verdict

**PASS** for survey surface · **WARNING** for Phase 1 open APIs
`
);

w(
  "SECURITY-AUDIT.md",
  `# Security Audit — Phase 4 RC

| Control | Status | Notes |
|---------|--------|-------|
| Authentication | PASS | JWT + cookie; mock local only |
| RBAC | PASS | Role matrix tested |
| Tenant isolation | PASS | Server-derived tenant |
| Session revoke | PASS | test:rbac |
| Upload validation | PASS | MIME + magic bytes + safe name |
| Attachment authz | PASS | Tenant-scoped keys |
| SQL injection | PASS (static) | Parameterized pg / sqlite prepared |
| XSS | WARNING | React escaping; no full XSS suite executed |
| CSRF | WARNING | SameSite=lax cookies; full CSRF matrix MANUAL |
| Rate limiting | PASS | In-process (Redis needed multi-instance) |
| Privilege escalation | PASS (unit) | Viewer/driver command blocks tested |
| Seed password | WARNING | ChangeMe!Pilot1 — rotate on pilot |
| Dependency CVE audit | NOT EXECUTED | npm audit endpoint returned 410 |
| Pen test | MANUAL | Pending pilot |

## Verdict

**PASS with WARNINGs** — no critical unverified auth hole on survey APIs.
`
);

w(
  "PERFORMANCE-AUDIT.md",
  `# Performance Audit — Phase 4 RC

## Executed

| Metric | Result | Status |
|--------|--------|--------|
| SGE 100 vehicles × 120 ticks | p95 ≤ 0.1 ms | PASS |
| Stress heap | ~14–15 MB | PASS |
| Shared GPS Socket.IO | singleton LiveGps provider (design) | PASS (static) |
| Shared survey SSE | ref-counted EventSource | PASS (static) |
| Decision sync throttle | ≥5s / state-change | PASS (static) |

## Not executed

| Item | Status |
|------|--------|
| Bundle analyzer report | NOT EXECUTED (no webpack-bundle-analyzer); build First Load JS ~102 kB from prior build |
| 60-min full-stack soak | NOT EXECUTED |
| Map FPS under 100 markers | MANUAL |

## Verdict

**PASS** for SGE CPU path · **MANUAL / NOT EXECUTED** for full browser soak
`
);

w(
  "DEPLOYMENT-AUDIT.md",
  `# Deployment Package Audit — Phase 4 RC

| Asset | Present | Live validated |
|-------|---------|----------------|
| Dockerfile (app+worker) | YES | NOT EXECUTED |
| docker-compose.local.yml | YES | NOT EXECUTED |
| docker-compose.pilot.yml | YES | NOT EXECUTED |
| docker-compose.production-template.yml | YES | NOT EXECUTED |
| Nginx pilot.conf | YES | NOT EXECUTED |
| .env.local/pilot/municipality.example | YES | STATIC |
| Health / readiness | YES | code PASS |
| Backup/restore scripts | YES | NOT EXECUTED |
| Migration scripts | YES | NOT EXECUTED |

Startup order (pilot compose): postgres healthy → app/worker; nginx fronts app.

## Verdict

**PASS** (package completeness) · **NOT EXECUTED** (Docker/Postgres runtime)
`
);

w(
  "DOCUMENTATION-AUDIT.md",
  `# Documentation Audit — Phase 4 RC

## Core docs present

README, INSTALLATION, ARCHITECTURE, API, DEPLOYMENT, ENVIRONMENT, CONTRIBUTING, COLLABORATION, plus Phase 2/3/24 sets.

## Consistency

| Issue | Severity |
|-------|----------|
| Multiple overlapping FINAL-* / RELEASE-* certificates | WARNING — historical; do not delete |
| Phase 24 GO/NO-GO and Phase 3 LOCAL-CERTIFICATION align on infra blockers | PASS |
| Env examples match app-config required keys | PASS (static) |

## Verdict

**PASS with WARNING** (doc sprawl; content adequate for RC handoff)
`
);

w(
  "LOCAL-UAT.md",
  `# Local Acceptance Test — Phase 4 RC

## Automated (executed)

\`\`\`bash
pnpm test:uat
\`\`\`

In-process workflow:

1. Supervisor + driver login  
2. Create → approve → start assignment  
3. SGE GPS on-route + deviation  
4. Persist decision  
5. Pause / resume  
6. Supervisor command  
7. Blockage + photo validation/storage  
8. Complete  
9. Audit + restore get  
10. Outbox process  
11. Tenant isolation smoke  

See test output for PASS/FAIL counts.

## Manual validation required (browser)

- [ ] Create tenant/users via UI (or seed)  
- [ ] Upload route GeoJSON  
- [ ] Assign from Dashboard / Copilot  
- [ ] Live GPS deviation voice + supervisor alert  
- [ ] Photo from camera on mobile  
- [ ] Browser refresh restores assignment  
- [ ] App restart restores from API/Postgres (pilot)  
- [ ] EN / AR RTL visual check  

## Verdict

Automated UAT: see execution results in certification run.  
Browser field matrix: **MANUAL VALIDATION REQUIRED**
`
);

console.log("Phase 4 audit docs written");
