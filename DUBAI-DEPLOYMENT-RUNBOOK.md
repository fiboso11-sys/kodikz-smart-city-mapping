# Dubai Deployment Runbook

**App deploy executor:** Dubai infrastructure team  
**Kodikz:** Package + support  
**Do not skip recording a rollback point (step 16).**

| # | Step | Responsible | Procedure | Expected | Failure symptom | Recovery |
|---|------|-------------|-----------|----------|-----------------|----------|
| 1 | Provision server | Dubai | Ubuntu 22.04/24.04 · ≥4 vCPU · ≥8 GB · ≥150 GB · static IP | SSH works | No SSH | Fix network/security group |
| 2 | Install Docker + Compose | Dubai | Engine + compose plugin per Docker docs | `docker version` OK | daemon down | Reinstall / start service |
| 3 | Configure DNS | Dubai | A/AAAA → VPS | Resolves to host | NXDOMAIN | Fix DNS TTL |
| 4 | Configure TLS | Dubai | Certs in `deploy/certs/fullchain.pem` + `privkey.pem` | Files readable by Nginx | Nginx SSL fail | Fix paths/perms |
| 5 | Create secret env | Dubai | Copy `.env.pilot.example` → `.env.pilot` mode 600; fill secrets | File present, not in git | App ConfigError | Fix required vars |
| 6 | Start Postgres + object storage | Dubai | `docker compose -f docker-compose.pilot.yml up -d postgres minio` | Healthy postgres; MinIO up | Restart loop | Check env/volumes |
| 7 | Verify service health | Dubai | `pg_isready`; MinIO console/API internal | Ready | Connection refused | Logs + disk |
| 8 | Run DB migrations | Dubai (+Kodikz support) | `pnpm migrate:pg` with DATABASE_URL | schema_migrations=1 | SQL error | Restore backup; fix |
| 9 | Start backend (app) | Dubai | `docker compose up -d app worker` | Containers running | Crash / pnpm missing | Confirm Corepack image; logs |
| 10 | Verify backend health | Dubai + Joint | `curl` `/api/health` + `/api/readiness` | 200 ready | 503 | PG/S3/env |
| 11 | Start frontend | Dubai | Same `app` service serves UI | HTTPS page loads | 502 | Nginx upstream |
| 12 | Configure Nginx + WS | Dubai | Use `deploy/nginx/pilot.conf`; SSE + optional Socket.IO | 443 serves app | SSL/upstream errors | Fix conf; reload |
| 13 | Smoke tests | Joint | Login, dashboard, live map | Pass checklist subset | Auth/GPS fail | See acceptance list |
| 14 | GPS + realtime | Joint | Live vehicle; Socket.IO; SSE | Live badge / events | Disconnected | URLs/firewall outbound |
| 15 | Validate backup | Dubai | `pg-backup.sh` once | Dump + sha256 | pg_dump missing | Install client tools |
| 16 | Record rollback point | Dubai | Tag image digests + backup filename + git commit of package | Written to ops log | — | Use for restore |
| 17 | Pilot acceptance | Joint | Complete `PILOT-HANDOVER-ACCEPTANCE-CHECKLIST.md` | Signed GO | Open failures | Fix owners |

## Rollback (application)

1. `docker compose stop app worker`  
2. Restore Postgres from step-16 dump  
3. `docker compose up -d` previous image digest  
4. Recheck readiness  
