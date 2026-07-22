/**
 * Phase 5.3 — generate Kodikz→Dubai handover documentation package.
 * Run: node scripts/write-phase53-handover-docs.cjs
 */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const w = (name, body) => {
  fs.writeFileSync(path.join(root, name), body.trimStart());
  console.log("wrote", name);
};

w(
  "FRONTEND-RC1-HANDOVER.md",
  `# Frontend RC1 Handover

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Owner:** Kodikz  
**Status:** Frontend RC1 frozen (internal pilot) · Score 91/100 (Phase 4.2F)  
**Date:** 2026-07-22  

## Quality gates (this session)

| Gate | Result |
|------|--------|
| \`pnpm type-check\` / \`pnpm lint\` (\`tsc --noEmit\`) | **PASS** |
| \`NEXT_DIST_DIR=.next-release pnpm build\` | **PASS** |
| Arabic / English locale foundation | Present (\`src/lib/i18n\`) |

## Build & start

| Item | Value |
|------|--------|
| Node | **20.x** (validated host Node **v20.20.2**; image \`node:20-bookworm-slim\`) |
| pnpm | **10.33.4** (\`packageManager\`; Dockerfile Corepack prepare) |
| Build | \`pnpm build\` |
| Start | \`pnpm start\` |
| Container | Dockerfile target \`runner\` · \`CMD ["pnpm","start"]\` |

## Ports

| Port | Use |
|------|-----|
| **3000** | Next.js app (TLS at Nginx on pilot) |

## Health / readiness

| Path | Purpose |
|------|---------|
| \`/api/health\` | Aggregate health JSON |
| \`/api/readiness\` | **503** if pilot Postgres/object storage unhealthy |
| Nginx | \`/health\`, \`/readiness\` proxy to above |

## Required public / app URL env

| Variable | Required (pilot) | Description |
|----------|------------------|-------------|
| \`NEXT_PUBLIC_API_URL\` | Yes | GPS HTTP API base |
| \`NEXT_PUBLIC_SOCKET_URL\` | Yes | GPS Socket.IO base |
| \`APP_URL\` | Yes | Public HTTPS app URL |
| \`DEPLOYMENT_MODE\` | Yes | \`pilot\` |

Full matrix: \`ENVIRONMENT-CONFIGURATION-MATRIX.md\`.

## Runtime dependencies

- Modern browsers
- Outbound HTTPS to Carto/OSM tiles + MapLibre glyphs CDN
- Browser reachability to GPS Socket.IO URL

## Known limitations

- RC1 freeze — bugfix only
- Device lab / sleep-wake → joint pilot acceptance
- Docker runtime → **REQUIRES DUBAI SERVER VALIDATION**
`
);

w(
  "BACKEND-RC1-HANDOVER.md",
  `# Backend RC1 Handover

**Owner:** Kodikz  
**Runtime:** Next.js App Router API + optional worker  
**Date:** 2026-07-22  

## Architecture note

Survey backend and UI ship as **one Next.js process** (port 3000). Worker: \`pnpm worker\`. GPS Socket.IO + MongoDB stay on the **external GPS backend**.

## Quality gates (this session)

| Gate | Result |
|------|--------|
| Type-check / production build | **PASS** |
| \`pnpm test:uat\` | **24 passed** |
| \`pnpm test:rbac\` | **20 passed** |

## Build & start

| Item | Value |
|------|--------|
| Build | \`pnpm build\` |
| Start API/UI | \`pnpm start\` |
| Worker | \`pnpm worker\` |
| Migrate | \`pnpm migrate:pg\` |

## Required services (pilot)

PostgreSQL 16 · S3/MinIO · External GPS HTTP+Socket.IO · Optional Redis if horizontally scaled

## Ports

| Port | Rule |
|------|------|
| 3000 | Behind Nginx |
| 5432 / 9000 | **Internal only** |

## Health paths

\`GET /api/health\` · \`GET /api/readiness\` (503 when not ready) · \`GET /api/gps/health\` · \`GET /api/system-health\`

## Auth

\`POST /api/auth/login\` · \`POST /api/auth/logout\` · cookie \`kodikz_access\` · JWT via Bearer  
Roles: SUPER_ADMIN, TENANT_ADMIN, SUPERVISOR, DRIVER, VIEWER  
Pilot: \`AUTH_PROVIDER=local\`, \`MOCK_AUTH_ENABLED=false\`, \`AUTH_JWT_SECRET\` ≥32 chars — **rotate seeded passwords**

## Timeouts (recommendations)

Health ≥15s · vehicles/live ≥15–30s · Socket.IO / SSE long read timeouts (see Nginx template)

## Known limitations

MongoDB not owned by this app · Docker runtime proof on Dubai server
`
);

w(
  "DATABASE-DEPLOYMENT-GUIDE.md",
  `# Database Deployment Guide

**Owner:** Kodikz (schema/migrations) · Dubai (Postgres hosting/ops)  
**Engine:** PostgreSQL **16**  
**Schema version:** \`POSTGRES_SCHEMA_VERSION = 1\` (\`src/lib/db/postgres/schema.ts\`)  

## Compatibility

| Item | Requirement |
|------|-------------|
| PostgreSQL | 16.x (Compose: \`postgres:16-alpine\`) |
| Extensions | **None required** beyond default |
| SSL | Pilot private Docker net: \`DATABASE_SSL=false\` OK · Municipality: \`true\` |
| Pool | \`DATABASE_POOL_MAX\` default **20** (pilot) / **40** (municipality example) |

## What ships

| Artifact | Path |
|----------|------|
| Migration SQL + indexes | \`src/lib/db/postgres/schema.ts\` (\`POSTGRES_MIGRATION_001\`) |
| Apply + seed roles/perms/tenant | \`src/lib/db/postgres/migrate.ts\` · \`pnpm migrate:pg\` |
| Pool | \`src/lib/db/postgres/pool.ts\` |
| Backup / restore scripts | \`deploy/backup/pg-backup.sh\`, \`pg-restore.sh\` |

## Data classes

| Class | Contents | Production |
|-------|----------|------------|
| **Required schema** | All \`CREATE TABLE\` / indexes / constraints in migration 001 | **Must apply** |
| **Required reference seed** | Roles, permissions, role_permissions, tenant \`dubai-giscd\` | **Must apply** (via migrate) |
| **Optional demo / local auth seed** | In-memory/local users with password \`ChangeMe!Pilot1\` (auth provider) | **Must rotate / replace** — never leave default in pilot |
| **Never load in production** | SQLite local DBs, developer mock fixtures, \`MOCK_AUTH\` users | Forbidden when \`DEPLOYMENT_MODE=pilot\|municipality\` |

## MongoDB

**Not part of survey Postgres.** Owned by GPS backend stack. Dubai keeps GPS Mongo separate.

## Connection string (placeholder)

\`postgresql://USER:PASSWORD@postgres:5432/giscd\`
`
);

w(
  "DATABASE-MIGRATION-RUNBOOK.md",
  `# Database Migration Runbook

**Responsible:** Dubai DBA/ops executes · Kodikz supports  

## Order

1. PostgreSQL healthy (\`pg_isready\`)
2. Set \`DATABASE_URL\` in environment (no secrets in git)
3. From app image or checkout with deps: \`pnpm migrate:pg\`
4. Confirm \`schema_migrations.version = 1\`

## Command

\`\`\`bash
export DATABASE_URL='postgresql://…'   # from secret store
pnpm migrate:pg
\`\`\`

Expected console: \`{ version: 1, applied: true }\` on first run; \`applied: false\` if already applied.

## Validation queries

\`\`\`sql
SELECT version, name, applied_at FROM schema_migrations;
SELECT COUNT(*) AS roles FROM roles;
SELECT COUNT(*) AS permissions FROM permissions;
SELECT id, code FROM tenants WHERE id = 'dubai-giscd';
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
\`\`\`

## Post-migration smoke

1. \`curl -sf http://127.0.0.1:3000/api/readiness\` → \`ready: true\`
2. Login as rotated pilot user
3. Create/list assignment (supervisor)

## Failure symptoms

| Symptom | Action |
|---------|--------|
| \`DATABASE_URL not configured\` | Fix env; restart |
| Connection refused | Postgres not up / wrong host |
| Partial tables | Re-run migrate (IF NOT EXISTS safe); investigate errors |

## Rollback

See \`DATABASE-ROLLBACK-RUNBOOK.md\` (restore from backup — no down-migration SQL shipped).
`
);

w(
  "DATABASE-ROLLBACK-RUNBOOK.md",
  `# Database Rollback Runbook

**Policy:** Schema v1 has **no automated down migration**. Rollback = restore from logical backup taken **before** change.

## Steps

1. Stop app + worker (\`docker compose stop app worker\`) to prevent writes  
2. Restore dump: \`./deploy/backup/pg-restore.sh /var/backups/kodikz/postgres/giscd-TIMESTAMP.dump\`  
3. Verify counts (script prints \`survey_assignments\` / \`audit_events\`)  
4. Start app + worker  
5. Hit \`/api/readiness\`  
6. Spot-check login + one assignment  

## Failure

If restore fails mid-way, restore again from known-good dump; do not partially apply app code that expects newer schema (v1 only today).
`
);

w(
  "DATABASE-BACKUP-RESTORE-GUIDE.md",
  `# Database Backup & Restore Guide

**Scripts (Kodikz-owned):** \`deploy/backup/pg-backup.sh\` · \`deploy/backup/pg-restore.sh\`  
**Execution:** Dubai ops on Pilot VPS  

## Backup

\`\`\`bash
export DATABASE_URL='postgresql://…'
export BACKUP_DIR=/var/backups/kodikz/postgres
./deploy/backup/pg-backup.sh
\`\`\`

Produces \`giscd-YYYYMMDDTHHMMSSZ.dump\` + \`.sha256\`.

## Restore

\`\`\`bash
export DATABASE_URL='postgresql://…'
./deploy/backup/pg-restore.sh /var/backups/kodikz/postgres/giscd-….dump
\`\`\`

## Retention (recommendation for Dubai)

| Type | Retention |
|------|-----------|
| Daily logical dump | 14 days |
| Pre-migrate dump | Keep until next successful migrate + 7 days |
| Provider volume snapshot | Per Dubai policy |

## Object storage

MinIO/S3 bucket backup is **Dubai-owned** (versioning or \`mc mirror\`). Not automated in these scripts.
`
);

console.log("batch A done");
