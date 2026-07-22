# Known Limitations — RC1 1.0.0

**Release:** RC1 1.0.0  
**Date:** 2026-07-22  

These are **documented limitations**, not open defects unless noted.

## Runtime / infrastructure

| Limitation | Impact | Owner |
|------------|--------|-------|
| Docker runtime certification not executed on Dubai VPS | Compose/image start unproven on target host | Dubai |
| Kodikz Windows workstation has no Docker | Cannot substitute for Dubai runtime | Environment |
| MinIO has no Compose healthcheck | Possible brief readiness race at cold start | Dubai validate |
| TLS certs / `.env.pilot` not shipped | Must be created on server | Dubai |

## Application

| Limitation | Impact | Owner |
|------------|--------|-------|
| Frontend RC1 freeze | Bugfix only; no new features | Kodikz |
| Seeded local auth password must be rotated | Default seed unsafe if left unchanged | Joint |
| Arabic locale applies `dir` after hydrate | Brief LTR flash possible for stored `ar` | Accepted |
| Cluster label glyphs use public MapLibre font CDN | Labels need outbound HTTPS | Network allowlist |
| GPS + MongoDB are external | Survey app does not host Mongo | GPS ops |
| Survey realtime uses SSE (`/api/survey-events`), not a second Socket.IO server | Nginx must disable buffering for SSE | Dubai Nginx |
| Full physical device lab / OS sleep-wake | Deferred to pilot acceptance | Joint |
| Soak had occasional probe timeouts on overloaded/sleeping host | Transient; self-recovers | Ops monitoring |

## Data / database

| Limitation | Impact | Owner |
|------------|--------|-------|
| No automated SQL down-migration for schema v1 | Rollback = restore from backup | Dubai + Kodikz runbooks |
| SQLite allowed only in `DEPLOYMENT_MODE=local` | Pilot must use Postgres | Config |

## Process

| Limitation | Impact | Owner |
|------------|--------|-------|
| Large RC1 working tree may be uncommitted until freeze approval | HEAD alone may not equal full package | Kodikz Release Manager |
| No Git tag until explicit approval | Version identity via package 1.0.0 + schema 1 until tagged | Kodikz |

## Explicitly not bugs

- Absence of Dubai server access during Kodikz audits
- Placeholder values in `*.example` env files
