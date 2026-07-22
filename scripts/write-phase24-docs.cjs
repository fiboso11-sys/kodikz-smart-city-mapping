const fs = require("fs");

const docs = {
  "PHASE24-FINAL-ARCHITECTURE.md": `# Phase 24 Final Architecture

Modular monolith for Dubai GISCD survey operations.

## Services
- Next.js web + Survey API
- Background worker (outbox)
- Existing GPS backend (MongoDB + Socket.IO) — unchanged
- PostgreSQL (survey domain)
- S3-compatible object storage
- Nginx reverse proxy
- Optional Redis (multi-instance)

## Data ownership
| Store | Owns |
|-------|------|
| PostgreSQL | tenants, users, assignments, decisions, alerts, commands, audit, photo metadata |
| MongoDB | GPS telemetry (existing) |
| Object storage | photo binaries |

## Decision source
Survey Guidance Engine remains the only calculator of survey decisions.
`,
  "PHASE24-PILOT-SERVER-REQUIREMENTS.md": `# Pilot Server Requirements

## Minimum (≤100 vehicles)
- 4 vCPU / 8 GB RAM / 150 GB SSD
- Ubuntu Server LTS
- Static IP or DNS + TLS
- Daily backup destination

## Preferred
- 8 vCPU / 16 GB RAM / 250 GB+ SSD
- Firewall + private Docker network
- Separate backup storage

## One-server pilot stack
Nginx + App + Worker + PostgreSQL + MinIO (+ optional Redis)

GPS backend remains on existing VPS.
`,
  "PHASE24-MUNICIPALITY-INFRASTRUCTURE-REQUIREMENTS.md": `# Municipality Infrastructure Checklist

Provide externally:
- [ ] Reverse proxy / load balancer + TLS
- [ ] PostgreSQL
- [ ] S3-compatible object storage
- [ ] Redis (if horizontally scaled)
- [ ] OIDC/OAuth/SAML IdP
- [ ] Approved GPS MongoDB/Socket.IO integration
- [ ] Monitoring + log sink
- [ ] Backup destination + retention policy
- [ ] Internal DNS + network restrictions
- [ ] Audit retention requirements

Application ships as containers; no Kodikz-controlled cloud required.
`,
  "PHASE24-POSTGRESQL-SCHEMA.md": `# PostgreSQL Schema

Source of truth: \`src/lib/db/postgres/schema.ts\` (migration 001).

Core tables include tenants, users, roles, permissions, drivers, vehicles, routes, permits, survey_assignments (with version), survey_sessions, survey_decisions, survey_progress, survey_alerts, survey_commands, blockage_reports, photo_attachments, notifications, audit_events, offline_sync_operations, application_sessions, event_outbox, background_jobs.

Timestamps are TIMESTAMPTZ (UTC). Presentation converts to Asia/Dubai.
`,
  "PHASE24-SQLITE-TO-POSTGRES-MIGRATION.md": `# SQLite → PostgreSQL Migration

\`\`\`bash
pnpm migrate:sqlite-export
npx tsx scripts/sqlite-to-postgres.ts dry-run
npx tsx scripts/sqlite-to-postgres.ts import
npx tsx scripts/sqlite-to-postgres.ts validate
\`\`\`

Creates a pre-migration SQLite backup under \`data/migrations/sqlite-export/\`.
Does not delete SQLite automatically.
Photo binaries must be copied to object storage separately; metadata migrates.
`,
  "PHASE24-AUTHENTICATION.md": `# Authentication

Providers: Local (pilot), OIDC adapter (municipality), Mock (local only).

- bcrypt password hashing
- JWT access tokens via jose
- HttpOnly cookie \`kodikz_access\`
- Login throttling and lockout
- Session revocation
- Seeded pilot accounts — change passwords immediately

Protected APIs use server-derived AuthContext only.
`,
  "PHASE24-RBAC-TENANT-ISOLATION.md": `# RBAC and Tenant Isolation

Roles: SUPER_ADMIN, TENANT_ADMIN, SUPERVISOR, DRIVER, VIEWER

Permission constants: \`src/lib/auth/permissions.ts\`

Tenant isolation is enforced in API handlers. Browser-supplied tenantId/role are never trusted for authorization.

Automated tests: \`pnpm test:rbac\`
`,
  "PHASE24-OBJECT-STORAGE.md": `# Object Storage

Abstraction supports upload, download, delete, exists, signedUrl, health.

Providers: local (dev only), S3/MinIO (pilot), municipality S3.

Validation covers size, MIME, magic bytes, and safe filenames.
Binaries never stored in PostgreSQL or SQLite.

API: \`/api/attachments\`
`,
  "PHASE24-REALTIME-ARCHITECTURE.md": `# Realtime Architecture

GPS Socket.IO remains on the existing backend.

Survey sync uses an SSE adapter behind a transport abstraction so Socket.IO survey can be added later without changing UI stores.

Normalized event fields: eventId, eventType, tenantId, assignmentId, vehicleId, timestamp, revision, payload.

Critical events are written to the outbox, then published by the worker.
`,
  "PHASE24-BACKGROUND-WORKER.md": `# Background Worker

Run: \`pnpm worker\`

Primary job: process \`event_outbox\` with retry metadata.

Planned jobs: idle timeout, orphan photo cleanup, reverse-geocode queue, audit maintenance.
`,
  "PHASE24-OFFLINE-SYNC.md": `# Offline Sync

Client offline queue persists assignments, decisions, blockages, and progress with coalescing and retries.

Server is authoritative for supervisor lifecycle actions.
Driver blockages should merge idempotently (PostgreSQL unique client_operation_id).
`,
  "PHASE24-DOCKER-DEPLOYMENT.md": `# Docker Deployment

Files:
- Dockerfile (runner + worker targets)
- docker-compose.local.yml
- docker-compose.pilot.yml
- docker-compose.municipality-template.yml

No secrets baked into images. Pilot uses \`.env.pilot\`.
`,
  "PHASE24-NGINX-NETWORKING.md": `# Nginx Networking

Config: \`deploy/nginx/pilot.conf\`

Routes: frontend, /api/*, SSE (/api/survey-events with buffering off), attachments, optional /socket.io/, /health, /readiness.

Do not expose PostgreSQL, Redis, or MinIO admin publicly.
`,
  "PHASE24-CONFIGURATION.md": `# Configuration

Validated by \`src/lib/config/app-config.ts\`.

Modes: local | pilot | municipality

Pilot and municipality refuse startup without PostgreSQL, S3-compatible storage, and real authentication.

Never place secrets in NEXT_PUBLIC_* variables.
`,
  "PHASE24-OBSERVABILITY.md": `# Observability

Structured JSON logs with requestId / tenantId; secrets redacted.

Endpoints: \`/api/health\`, \`/api/readiness\`.

Field pilot diagnostics remain behind RBAC.
`,
  "PHASE24-BACKUP-RESTORE.md": `# Backup and Restore

Scripts:
- \`deploy/backup/pg-backup.sh\`
- \`deploy/backup/pg-restore.sh\`

Agree RPO/RTO with Dubai team before go-live.

**Not executed on this development workstation (Docker/psql unavailable).**
`,
  "PHASE24-SECURITY-HARDENING.md": `# Security Hardening

Implemented in code: authentication, RBAC, tenant checks, rate limiting, upload validation, secure cookies, standardized errors, assignment transition guards.

Still pending on pilot infrastructure: penetration test, optional Postgres RLS, full CSRF matrix for cookie flows, automated dependency CVE gate in CI.
`,
  "PHASE24-STRESS-TEST.md": `# Stress Test

\`pnpm stress:sge\` runs a 100-vehicle SGE CPU harness and writes \`data/stress-reports/\`.

Full API + PostgreSQL + SSE 60-minute stability test requires the Dubai pilot VPS.
`,
  "PHASE24-FAILURE-RECOVERY.md": `# Failure and Recovery

Documented code behaviors:
- Object storage down → uploads return STORAGE_UNAVAILABLE; survey continues
- Invalid assignment transitions → 409
- Auth failures → 401/403
- Outbox publish failures → retry / FAILED state
- Offline queue flush on reconnect

Full chaos matrix (Postgres/Nginx/container restarts) pending pilot execution.
`,
  "PHASE24-FIELD-PILOT-PLAN.md": `# Field Pilot Plan

1. Provision Ubuntu VPS + DNS + TLS
2. Configure \`.env.pilot\` and start docker-compose.pilot.yml
3. Run PostgreSQL migrations and rotate seeded passwords
4. Create MinIO/S3 bucket
5. Keep GPS backend URL pointed at existing service
6. Execute one-vehicle Teltonika field run
7. Perform backup + restore drill
8. Run 100-vehicle stress on pilot hardware
9. Sign PHASE24-DEPLOYMENT-GO-NO-GO.md
`,
  "PHASE24-FINAL-E2E-AUDIT.md": `# Final E2E Audit

See the Phase 24 final report and GO/NO-GO matrix for executed vs pending checks.

Local workstation executed: type-check/build where possible, SGE/platform/RBAC/unit harnesses, Phase 2.3 service E2E.

Not executed here: Docker compose pilot, Nginx live validation, PostgreSQL backup/restore, 60-minute full-stack stress.
`,
  "PHASE24-DEPLOYMENT-GO-NO-GO.md": `# Deployment GO / NO-GO

## Decision: NO-GO for production pilot cutover from this workstation

Critical blockers (environment, not missing design):
1. Docker not installed — cannot prove compose pilot stack startup
2. PostgreSQL/psql not available — cannot prove migrate/backup/restore
3. 60-minute full-stack stress not runnable without pilot VPS
4. Object storage live S3/MinIO not validated end-to-end on this host

Code and assets for the above are present. Re-run validation on the Dubai team VPS before GO.
`,
};

for (const [name, body] of Object.entries(docs)) {
  fs.writeFileSync(name, body);
  console.log("wrote", name);
}
