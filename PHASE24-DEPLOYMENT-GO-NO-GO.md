# Deployment GO / NO-GO

## Decision: **NO-GO** for Dubai pilot cutover from this workstation

Code and deployment assets for Phase 24 are present. This environment cannot prove the mandatory infrastructure gates.

### Critical blockers (Severity: Blocker)

| # | Blocker | Owner | Remediation |
|---|---------|-------|-------------|
| 1 | Docker not installed — cannot start pilot compose stack | Dubai team / DevOps | Install Docker on Ubuntu pilot VPS; run `docker compose -f docker-compose.pilot.yml up` |
| 2 | PostgreSQL / psql unavailable — cannot run migrate, backup, restore | Dubai team / DBA | Provision Postgres 16; run migration + `deploy/backup/pg-backup.sh` + restore drill |
| 3 | Live S3/MinIO not validated end-to-end | Dubai team | Configure MinIO or existing S3; set `STORAGE_PROVIDER=s3`; hit `/api/attachments` |
| 4 | 60-minute full-stack stress (API+DB+SSE+GPS) not executed | QA on pilot | Run after stack is up; keep SGE harness results as baseline |
| 5 | Remaining survey routes still use legacy helpers (not all auth-wrapped) | Engineering | Finish wrapping decisions/alerts/blockages/timeline with `withSurveyAuth` before pilot |

### Executed and passed (this workstation)

- `pnpm type-check`
- `pnpm build` (via `NEXT_DIST_DIR=.next-release`)
- `pnpm test:rbac` — 20/20
- `pnpm test:e2e23` — 26/26
- `pnpm test:sge` — 23/23
- `pnpm test:platform` — 29/29
- `pnpm stress:sge` — 100 vehicles × 120 ticks; p95 decision **0.118 ms**; target under 100 ms **PASS**

### Not executed here

- Docker production image build
- Docker pilot stack startup
- Nginx live validation
- PostgreSQL backup + restore proof
- Object-storage live health against MinIO/S3
- 60-minute multi-client stability
- Real Teltonika field test
- Arabic/RTL visual QA (manual)
- Full Phase 1/2 browser regression matrix

### Path to GO

1. Provision pilot VPS per `PHASE24-PILOT-SERVER-REQUIREMENTS.md`
2. Configure `.env.pilot` from `.env.pilot.example`
3. Start stack; migrate Postgres; rotate seeded passwords
4. Prove backup/restore once
5. Finish auth wrapping on remaining APIs
6. Run full E2E + stress on pilot
7. Re-issue GO sign-off
