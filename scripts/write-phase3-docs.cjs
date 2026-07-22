const fs = require("fs");

const docs = {
  "PHASE3-INFRASTRUCTURE.md": `# Phase 3 — Infrastructure

Deployment modes: \`local\` | \`pilot\` | \`municipality\` (\`src/lib/config/app-config.ts\`).

| Mode | PostgreSQL | S3 storage | Auth | SQLite |
|------|------------|------------|------|--------|
| local | optional | local disk ok | mock/local | allowed |
| pilot | required | S3/MinIO required | real auth required | **forbidden** |
| municipality | required | municipality S3 | OIDC | **forbidden** |

Fail-closed: missing DATABASE_URL in pilot/municipality throws \`ConfigError\` at startup.
`,
  "PHASE3-AUTHENTICATION.md": `# Phase 3 — Authentication

- Provider abstraction: Local / OIDC stub / Mock (local only)
- bcrypt passwords, JWT (jose), HttpOnly cookie, login throttle/lockout, session revoke
- Login: \`POST /api/auth/login\`
- Logout: \`POST /api/auth/logout\`
- Server context: userId, tenantId, roles, permissions, sessionId, requestId

Tests: \`pnpm test:rbac\`
`,
  "PHASE3-RBAC.md": `# Phase 3 — RBAC

Roles: SUPER_ADMIN, TENANT_ADMIN, SUPERVISOR, DRIVER, VIEWER

Permissions: \`src/lib/auth/permissions.ts\`

All survey APIs use \`withSurveyAuth\` / \`resolveAuthContext\`.
Tenant always from server session — never trusted from browser alone.

Tests: \`pnpm test:rbac\`, \`pnpm test:api-auth\`
`,
  "PHASE3-POSTGRESQL.md": `# Phase 3 — PostgreSQL

Schema: \`src/lib/db/postgres/schema.ts\`
Migrate: \`src/lib/db/postgres/migrate.ts\`
Pool: \`src/lib/db/postgres/pool.ts\`
SQLite→PG tool: \`scripts/sqlite-to-postgres.ts\`

SQLite remains local-dev only via \`resolveDbBackend()\`.

**Live Postgres migrate/backup/restore: NOT EXECUTED on this workstation (no psql/Docker).**
`,
  "PHASE3-OBJECT-STORAGE.md": `# Phase 3 — Object Storage

Abstraction: \`src/lib/storage/object-storage.ts\`
Providers: local (dev), S3/MinIO, disabled

API: \`/api/attachments\` (authenticated)
Legacy: \`/api/survey-photos\` re-exports attachments handlers

Validation: size, MIME, magic bytes, safe filename, tenant-scoped keys
`,
  "PHASE3-BACKGROUND-WORKER.md": `# Phase 3 — Background Worker

\`pnpm worker\` → \`scripts/worker.ts\`

Processes transactional outbox (\`event_outbox\` / in-memory local).
Retries failed publishes; does not require an open browser.
`,
  "PHASE3-DOCKER.md": `# Phase 3 — Docker

- \`Dockerfile\` (runner + worker)
- \`docker-compose.local.yml\`
- \`docker-compose.pilot.yml\`
- \`docker-compose.production-template.yml\`
- \`.env.*.example\`

**Docker build/compose: NOT EXECUTED (Docker not installed on this workstation).**
`,
  "PHASE3-NGINX.md": `# Phase 3 — Nginx

Config: \`deploy/nginx/pilot.conf\`

SSE buffering off for \`/api/survey-events\`, upload limits, security headers, health/readiness, optional Socket.IO upgrade.

**Live nginx -t: NOT EXECUTED (no nginx/Docker here).** Static file present.
`,
  "PHASE3-SECURITY.md": `# Phase 3 — Security

Implemented: authN/Z, RBAC, tenant filters, rate limits, upload validation, secure cookies, standard errors, assignment transition guards, SSE auth.

Pending on pilot VPS: penetration test, live TLS, dependency CVE CI gate, optional PG RLS.
`,
  "PHASE3-STRESS.md": `# Phase 3 — Stress

\`pnpm stress:sge\` — 100 vehicles × 120 ticks SGE CPU harness.

Full API+Postgres+SSE 60-minute test requires pilot VPS.
`,
  "PHASE3-BACKUP.md": `# Phase 3 — Backup

Scripts: \`deploy/backup/pg-backup.sh\`, \`pg-restore.sh\`

**NOT EXECUTED on this workstation.** Must be proven once on pilot Postgres before GO.
`,
  "PHASE3-OBSERVABILITY.md": `# Phase 3 — Observability

Structured logger: \`src/lib/observability/logger.ts\`
Health: \`/api/health\`
Readiness: \`/api/readiness\`
Field pilot panel behind diagnostics permission intent.
`,
  "PHASE3-FAILURE-RECOVERY.md": `# Phase 3 — Failure Recovery

| Failure | Behavior |
|---------|----------|
| Storage down | 503 STORAGE_UNAVAILABLE; survey continues |
| Invalid transition | 409 |
| Auth failure | 401/403 |
| Outbox publish fail | retry / FAILED |
| Offline | queue + flush on reconnect |
| Pilot missing PG | startup ConfigError |

Full chaos (container/DB restart): MANUAL on pilot.
`,
  "PHASE3-LOCAL-CERTIFICATION.md": `# Phase 3 — Local Certification Matrix

See final report in chat / \`PHASE3-LOCAL-CERTIFICATION.md\` status table updated after test run.

Commands:
\`\`\`bash
pnpm install
pnpm lint
pnpm type-check
pnpm build
pnpm test:certification
\`\`\`
`,
};

for (const [name, body] of Object.entries(docs)) {
  fs.writeFileSync(name, body);
  console.log("wrote", name);
}
