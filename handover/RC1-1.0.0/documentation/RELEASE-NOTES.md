# Release Notes — RC1 1.0.0

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Release:** **RC1 1.0.0** (Internal Pilot)  
**Package version:** `1.0.0` (`package.json`)  
**Database schema:** migration version **1**  
**Date:** 2026-07-22  
**Audience:** Dubai Infrastructure Team · Kodikz Release Management  

---

## Summary

RC1 1.0.0 is the **internal pilot** release candidate for Dubai Municipality GISCD survey operations. It freezes the frontend and survey backend package for handover. Runtime deployment and server certification are owned by the Dubai infrastructure team.

## What's included

- Live monitoring, vehicles, permits, geo upload (Phase 1 GISCD surface)
- Survey Guidance Engine (SGE) + Driver Copilot + Supervisor Command Center
- Assignment lifecycle (assign → start → pause/resume → complete)
- PostgreSQL schema v1 + migration tooling
- Auth (local JWT for pilot) + RBAC roles
- Object storage integration (S3/MinIO)
- Health / readiness endpoints
- Docker multi-stage image + pilot/municipality Compose templates
- Nginx pilot template (TLS, SSE, optional Socket.IO proxy)
- Backup/restore scripts for PostgreSQL
- Full Dubai handover documentation set

## Quality evidence (Kodikz workstation)

| Gate | Result |
|------|--------|
| Type-check / lint | PASS |
| Production build | PASS |
| Local UAT | 24 passed |
| RBAC tests | 20 passed |
| Frontend RC1 readiness (prior) | Score 91 — approved for internal pilot |

## Not included / out of scope for this package

- Dubai VPS provisioning, Docker install on Dubai servers, DNS, TLS issuance
- Customer production rollout
- Official Git tag (requires explicit approval after this audit)
- MongoDB (owned by GPS backend)

## Upgrade / install

Follow `DUBAI-DEPLOYMENT-RUNBOOK.md` and `RC1-DEPLOYMENT-PACKAGE-MANIFEST.md`.

## Breaking changes

None relative to the RC1 freeze baseline (first formal RC1 package).

## Security notes

- Use `.env.pilot.example` placeholders only; never commit real secrets
- Rotate seeded pilot passwords before pilot users go live
- See `KNOWN-LIMITATIONS.md`
