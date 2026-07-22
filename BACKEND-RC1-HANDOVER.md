# Backend RC1 Handover

**Owner:** Kodikz  
**Runtime:** Next.js App Router API + optional worker  
**Date:** 2026-07-22  

## Architecture note

Survey backend and UI ship as **one Next.js process** (port 3000). Worker: `pnpm worker`. GPS Socket.IO + MongoDB stay on the **external GPS backend**.

## Quality gates (this session)

| Gate | Result |
|------|--------|
| Type-check / production build | **PASS** |
| `pnpm test:uat` | **24 passed** |
| `pnpm test:rbac` | **20 passed** |

## Build & start

| Item | Value |
|------|--------|
| Build | `pnpm build` |
| Start API/UI | `pnpm start` |
| Worker | `pnpm worker` |
| Migrate | `pnpm migrate:pg` |

## Required services (pilot)

PostgreSQL 16 · S3/MinIO · External GPS HTTP+Socket.IO · Optional Redis if horizontally scaled

## Ports

| Port | Rule |
|------|------|
| 3000 | Behind Nginx |
| 5432 / 9000 | **Internal only** |

## Health paths

`GET /api/health` · `GET /api/readiness` (503 when not ready) · `GET /api/gps/health` · `GET /api/system-health`

## Auth

`POST /api/auth/login` · `POST /api/auth/logout` · cookie `kodikz_access` · JWT via Bearer  
Roles: SUPER_ADMIN, TENANT_ADMIN, SUPERVISOR, DRIVER, VIEWER  
Pilot: `AUTH_PROVIDER=local`, `MOCK_AUTH_ENABLED=false`, `AUTH_JWT_SECRET` ≥32 chars — **rotate seeded passwords**

## Timeouts (recommendations)

Health ≥15s · vehicles/live ≥15–30s · Socket.IO / SSE long read timeouts (see Nginx template)

## Known limitations

MongoDB not owned by this app · Docker runtime proof on Dubai server
