const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const w = (name, body) => {
  fs.writeFileSync(path.join(root, name), body.trimStart());
  console.log("wrote", name);
};

w(
  "DUBAI-DEPLOYMENT-RUNBOOK.md",
  `# Dubai Deployment Runbook

**App deploy executor:** Dubai infrastructure team  
**Kodikz:** Package + support  
**Do not skip recording a rollback point (step 16).**

| # | Step | Responsible | Procedure | Expected | Failure symptom | Recovery |
|---|------|-------------|-----------|----------|-----------------|----------|
| 1 | Provision server | Dubai | Ubuntu 22.04/24.04 · ≥4 vCPU · ≥8 GB · ≥150 GB · static IP | SSH works | No SSH | Fix network/security group |
| 2 | Install Docker + Compose | Dubai | Engine + compose plugin per Docker docs | \`docker version\` OK | daemon down | Reinstall / start service |
| 3 | Configure DNS | Dubai | A/AAAA → VPS | Resolves to host | NXDOMAIN | Fix DNS TTL |
| 4 | Configure TLS | Dubai | Certs in \`deploy/certs/fullchain.pem\` + \`privkey.pem\` | Files readable by Nginx | Nginx SSL fail | Fix paths/perms |
| 5 | Create secret env | Dubai | Copy \`.env.pilot.example\` → \`.env.pilot\` mode 600; fill secrets | File present, not in git | App ConfigError | Fix required vars |
| 6 | Start Postgres + object storage | Dubai | \`docker compose -f docker-compose.pilot.yml up -d postgres minio\` | Healthy postgres; MinIO up | Restart loop | Check env/volumes |
| 7 | Verify service health | Dubai | \`pg_isready\`; MinIO console/API internal | Ready | Connection refused | Logs + disk |
| 8 | Run DB migrations | Dubai (+Kodikz support) | \`pnpm migrate:pg\` with DATABASE_URL | schema_migrations=1 | SQL error | Restore backup; fix |
| 9 | Start backend (app) | Dubai | \`docker compose up -d app worker\` | Containers running | Crash / pnpm missing | Confirm Corepack image; logs |
| 10 | Verify backend health | Dubai + Joint | \`curl\` \`/api/health\` + \`/api/readiness\` | 200 ready | 503 | PG/S3/env |
| 11 | Start frontend | Dubai | Same \`app\` service serves UI | HTTPS page loads | 502 | Nginx upstream |
| 12 | Configure Nginx + WS | Dubai | Use \`deploy/nginx/pilot.conf\`; SSE + optional Socket.IO | 443 serves app | SSL/upstream errors | Fix conf; reload |
| 13 | Smoke tests | Joint | Login, dashboard, live map | Pass checklist subset | Auth/GPS fail | See acceptance list |
| 14 | GPS + realtime | Joint | Live vehicle; Socket.IO; SSE | Live badge / events | Disconnected | URLs/firewall outbound |
| 15 | Validate backup | Dubai | \`pg-backup.sh\` once | Dump + sha256 | pg_dump missing | Install client tools |
| 16 | Record rollback point | Dubai | Tag image digests + backup filename + git commit of package | Written to ops log | — | Use for restore |
| 17 | Pilot acceptance | Joint | Complete \`PILOT-HANDOVER-ACCEPTANCE-CHECKLIST.md\` | Signed GO | Open failures | Fix owners |

## Rollback (application)

1. \`docker compose stop app worker\`  
2. Restore Postgres from step-16 dump  
3. \`docker compose up -d\` previous image digest  
4. Recheck readiness  
`
);

w(
  "PILOT-HANDOVER-ACCEPTANCE-CHECKLIST.md",
  `# Pilot Handover Acceptance Checklist

Mark each row: Pass / Fail / N/A · Owner completes evidence.

| Check | Owner |
|-------|-------|
| Frontend loads over HTTPS | **Joint** |
| Authentication works (login/logout) | **Joint** |
| Role access works (supervisor vs driver) | **Kodikz** (validate) / **Joint** |
| \`/api/health\` passes | **Dubai** |
| \`/api/readiness\` passes | **Dubai** |
| PostgreSQL connection passes | **Dubai** |
| GPS backend connection passes | **Joint** |
| Socket.IO connects | **Joint** |
| Vehicle data received | **Joint** |
| Map loads (basemap + marker) | **Joint** |
| Assignments work | **Kodikz** / **Joint** |
| Survey session starts | **Joint** |
| Pause/resume persists after refresh | **Joint** |
| Driver Copilot works | **Joint** |
| Command Center updates | **Joint** |
| Arabic and English work | **Joint** |
| File/photo upload works | **Joint** |
| Logs available (\`docker compose logs\`) | **Dubai** |
| Backup command works | **Dubai** |
| Restart preserves persistent data | **Dubai** |
| HTTPS works | **Dubai** |
| WebSocket / SSE proxy works | **Dubai** / **Joint** |

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| Kodikz | | | |
| Dubai Infrastructure | | | |
| Pilot Product Owner | | | |
`
);

w(
  "RC1-DEPLOYMENT-PACKAGE-MANIFEST.md",
  `# RC1 Deployment Package Manifest

**Generated:** 2026-07-22  
**Branch:** \`phase2/dubai-giscd-enhancements\`  
**Git HEAD (last commit):** \`53afdeeeab11e2b5e8e2823c54dd043ae8c3b3b0\` — _note: substantial RC1/pilot work may still be uncommitted; do not treat HEAD alone as the full package until an approved release commit/tag_  

| Component | Version / reference |
|-----------|---------------------|
| Application package.json version | \`1.0.0\` |
| Frontend / Backend | Single Next.js 15 app |
| DB migration version | **1** (\`POSTGRES_SCHEMA_VERSION\`) |
| Node | 20.x (host probe v20.20.2) |
| pnpm | 10.33.4 |
| Dockerfile | Multi-stage deps/builder/runner/worker + Corepack |
| Compose | \`docker-compose.pilot.yml\` · production/municipality templates · local |
| Env template | \`.env.pilot.example\` |
| Migrations | \`src/lib/db/postgres/*\` · \`pnpm migrate:pg\` |
| Backup scripts | \`deploy/backup/*\` |
| Nginx template | \`deploy/nginx/pilot.conf\` |
| API docs | \`API-INTEGRATION-HANDOVER.md\` |
| Deployment runbook | \`DUBAI-DEPLOYMENT-RUNBOOK.md\` |
| Rollback | \`DATABASE-ROLLBACK-RUNBOOK.md\` + runbook §Rollback |
| Acceptance | \`PILOT-HANDOVER-ACCEPTANCE-CHECKLIST.md\` |
| Runtime checklist | \`DUBAI-SERVER-RUNTIME-VALIDATION-CHECKLIST.md\` |

## Quality evidence (Kodikz workstation, 2026-07-22)

| Gate | Result |
|------|--------|
| type-check / lint | PASS |
| production build (\`.next-release\`) | PASS |
| test:uat | 24/0 |
| test:rbac | 20/0 |
| Tracked real \`.env\` / \`.env.pilot\` | **Absent** (good) |

## Known limitations

- Dubai server runtime not executed by Kodikz  
- Seed credentials must be rotated  
- Uncommitted working tree until approved commit  
- No Git tag created (awaiting approval)  
`
);

w(
  "PHASE53-APPLICATION-DATABASE-HANDOVER-READINESS.md",
  `# Phase 5.3 — Application, Database & Deployment Handover Readiness

**Date:** 2026-07-22  
**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Scope:** Kodikz-owned deliverables for Dubai server team · No VPS access · No production deploy  

---

## 1. Executive Summary

Kodikz prepared a **handover package** covering frontend/backend release notes, database runbooks, environment contract, static Docker/Compose validation classifications, Dubai infrastructure requirements, API integration docs, deployment order, acceptance checklist, and package manifest.

**Absence of Dubai server access is not a Kodikz software failure.** All live server checks are marked **REQUIRES DUBAI SERVER VALIDATION**.

| Field | Value |
|-------|--------|
| **FINAL DECISION** | **2. READY WITH MINOR ACTIONS** |
| **Handover Readiness Score** | **88 / 100** |
| Frontend RC1 | Frozen · prior score 91 |
| Customer production | **Not authorized** |

### Minor actions (do not block document handover)

1. **Approve Git commit/tag** of the RC1 working tree + handover docs (not done — STOP forbids unapproved git).  
2. Dubai executes \`DUBAI-SERVER-RUNTIME-VALIDATION-CHECKLIST.md\` (Docker build/up/health).  
3. Rotate seeded pilot auth passwords before pilot users go live.

---

## 2. Responsibility Matrix

| Area | Kodikz | Dubai |
|------|--------|-------|
| Frontend / backend / DB schema / migrations | Own | Consume |
| Env specification / Compose / Dockerfile | Own | Execute on VPS |
| Health/readiness endpoints | Own | Monitor |
| Server OS / Docker / Nginx / DNS / TLS / firewall | Spec only | Own |
| Host monitoring / infra backups | Spec | Own |
| GPS + Mongo platform | Integration docs | Network allow + existing GPS ops |
| Runtime certification | Support | Execute |

---

## 3. Frontend Readiness

| Item | Status |
|------|--------|
| Production build | **PASS** |
| Type-check / lint | **PASS** |
| Handover doc | \`FRONTEND-RC1-HANDOVER.md\` |
| Freeze | Maintained — no feature edits this phase |

---

## 4. Backend Readiness

| Item | Status |
|------|--------|
| Build | **PASS** (same Next build) |
| UAT / RBAC | **PASS** 24 + 20 |
| Handover doc | \`BACKEND-RC1-HANDOVER.md\` |

---

## 5. Database Readiness

| Item | Status |
|------|--------|
| Schema v1 + indexes documented | Yes |
| Migration / rollback / backup guides | Yes |
| Live migrate on Dubai PG | **REQUIRES DUBAI SERVER VALIDATION** |

---

## 6. Environment Readiness

| Item | Status |
|------|--------|
| Matrix | \`ENVIRONMENT-CONFIGURATION-MATRIX.md\` |
| Template | \`.env.pilot.example\` (placeholders only) |
| Real secrets in repo | **None found** (\`.env\` / \`.env.pilot\` absent) |

---

## 7. Deployment Template Review

| Item | Classification |
|------|----------------|
| Dockerfile / Compose / Nginx | **STATICALLY VERIFIED** |
| Image build / compose up / TLS | **REQUIRES DUBAI SERVER VALIDATION** |
| Failed static item | None identified this phase |

---

## 8. API & Integration Readiness

Documented in \`API-INTEGRATION-HANDOVER.md\` (auth, roles, endpoints, SSE event names, GPS/Mongo boundary, proxy needs). **No API contract changes.**

---

## 9. Documentation Inventory

| Document | Purpose |
|----------|---------|
| FRONTEND-RC1-HANDOVER.md | FE release |
| BACKEND-RC1-HANDOVER.md | BE release |
| DATABASE-DEPLOYMENT-GUIDE.md | DB overview |
| DATABASE-MIGRATION-RUNBOOK.md | Migrate |
| DATABASE-ROLLBACK-RUNBOOK.md | Rollback |
| DATABASE-BACKUP-RESTORE-GUIDE.md | Backup/restore |
| ENVIRONMENT-CONFIGURATION-MATRIX.md | Env contract |
| .env.pilot.example | Pilot template |
| DUBAI-SERVER-RUNTIME-VALIDATION-CHECKLIST.md | Dubai runtime |
| DUBAI-INFRASTRUCTURE-REQUIREMENTS.md | Server requirements |
| API-INTEGRATION-HANDOVER.md | API/Socket |
| DUBAI-DEPLOYMENT-RUNBOOK.md | Ordered deploy |
| PILOT-HANDOVER-ACCEPTANCE-CHECKLIST.md | Joint UAT |
| RC1-DEPLOYMENT-PACKAGE-MANIFEST.md | Manifest |
| This file | Readiness decision |

---

## 10. Verified Blockers

| Blocker | Owner |
|---------|-------|
| No Dubai server runtime proof | **Dubai** (expected) |
| Release commit/tag not created | **Kodikz** pending approval |
| Default seed password if not rotated | **Joint** ops action |

No Kodikz application defect blocking **document handover**.

---

## 11. Action Lists

### Dubai-Team Actions
Provision/harden VPS · Docker · DNS/TLS · secrets · compose up · migrate · backup drill · runtime checklist · firewall

### Kodikz Actions
Support migrate/auth issues · clarify APIs · approve commit when asked · joint acceptance

### Joint Validation Actions
Complete \`PILOT-HANDOVER-ACCEPTANCE-CHECKLIST.md\`

---

## 12. Known Limitations

- Runtime Docker/Corepack not proven on Dubai host yet  
- Working tree ≠ committed release until approved  
- MinIO healthcheck not in Compose (validate startup race on server)  
- GPS/Mongo remain external  

---

## 13. Quality Gates (Kodikz package)

| Gate | Status |
|------|--------|
| Frontend production build | ✓ |
| Backend build + tests (UAT/RBAC) | ✓ |
| Migrations ordered & documented | ✓ |
| Env matrix complete | ✓ |
| No real secrets tracked | ✓ |
| Docker/Compose static validation | ✓ |
| API/Socket docs | ✓ |
| Dubai infra requirements | ✓ |
| Deployment order + rollback | ✓ |
| Acceptance checklist | ✓ |
| Runtime-only → Dubai | ✓ |
| No false server claims | ✓ |

---

## 14. Handover Readiness Score

**88 / 100** — package complete; minus points for uncommitted release state + pending Dubai runtime.

---

## 15. FINAL DECISION

# **2. READY WITH MINOR ACTIONS**

Kodikz release **documentation and quality gates** are sufficient to hand the package to Dubai for **server-side runtime certification and deployment execution**. Minor actions: approved git snapshot, Dubai runtime checklist, credential rotation.

**Not** customer production rollout. **Not** Phase 5.2B completion (that remains Dubai’s runtime work).

---

## STOP

No VPS provision · No Docker install on Dubai · No deploy · No commit/push/tag without approval · Awaiting review  

*End of Phase 5.3 Application/Database Handover Readiness.*
`
);

console.log("batch C done");
