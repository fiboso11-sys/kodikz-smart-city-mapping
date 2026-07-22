# Phase 24 Final Architecture

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
