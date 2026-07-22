# RC1 Deployment Package Manifest

**Generated:** 2026-07-22  
**Release identity:** **RC1 1.0.0**  
**Branch:** `phase2/dubai-giscd-enhancements`  
**Git HEAD (last commit):** `53afdeeeab11e2b5e8e2823c54dd043ae8c3b3b0` — _note: substantial RC1/pilot work may still be uncommitted; do not treat HEAD alone as the full package until an approved release commit/tag_  

| Component | Version / reference |
|-----------|---------------------|
| RC1 / Release Notes | **RC1 1.0.0** (`RELEASE-NOTES.md`) |
| Application package.json version | `1.0.0` |
| Frontend / Backend | Single Next.js 15 full-stack app image `kodikz-smart-city-app:1.0.0-rc1` |
| Worker image | `kodikz-smart-city-worker:1.0.0-rc1` |
| Release identity | `src/lib/release-identity.ts` · `/api/release-identity` |
| System health | `/settings/system-health` · `/api/system-health` |
| About / Version | `/settings/about` |
| Support bundle | `scripts/support.sh` (sanitized) |
| Plug-and-play compose | `deploy/docker-compose.plugplay.yml` |
| DB migration version | **1** (`POSTGRES_SCHEMA_VERSION`) |
| Node | 20.x (host probe v20.20.2) |
| pnpm | 10.33.4 |
| Dockerfile | Multi-stage deps/builder/runner/worker + Corepack |
| Compose | `docker-compose.pilot.yml` · production/municipality templates · local |
| Env template | `.env.pilot.example` |
| Migrations | `src/lib/db/postgres/*` · `pnpm migrate:pg` |
| Backup scripts | `deploy/backup/*` |
| Nginx template | `deploy/nginx/pilot.conf` |
| API docs | `API-INTEGRATION-HANDOVER.md` |
| Deployment runbook | `DUBAI-DEPLOYMENT-RUNBOOK.md` |
| Rollback | `DATABASE-ROLLBACK-RUNBOOK.md` + runbook §Rollback |
| Acceptance | `PILOT-HANDOVER-ACCEPTANCE-CHECKLIST.md` |
| Runtime checklist | `DUBAI-SERVER-RUNTIME-VALIDATION-CHECKLIST.md` |

## Quality evidence (Kodikz workstation, 2026-07-22)

| Gate | Result |
|------|--------|
| type-check / lint | PASS |
| production build (`.next-release`) | PASS |
| test:uat | 24/0 |
| test:rbac | 20/0 |
| Tracked real `.env` / `.env.pilot` | **Absent** (good) |

## Known limitations

- Dubai server runtime not executed by Kodikz  
- Seed credentials must be rotated  
- Uncommitted working tree until approved commit  
- No Git tag created (awaiting approval)  
