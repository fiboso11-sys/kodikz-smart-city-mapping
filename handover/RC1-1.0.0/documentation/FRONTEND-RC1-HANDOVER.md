# Frontend RC1 Handover

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Owner:** Kodikz  
**Status:** Frontend RC1 frozen (internal pilot) · Score 91/100 (Phase 4.2F)  
**Date:** 2026-07-22  

## Quality gates (this session)

| Gate | Result |
|------|--------|
| `pnpm type-check` / `pnpm lint` (`tsc --noEmit`) | **PASS** |
| `NEXT_DIST_DIR=.next-release pnpm build` | **PASS** |
| Arabic / English locale foundation | Present (`src/lib/i18n`) |

## Build & start

| Item | Value |
|------|--------|
| Node | **20.x** (validated host Node **v20.20.2**; image `node:20-bookworm-slim`) |
| pnpm | **10.33.4** (`packageManager`; Dockerfile Corepack prepare) |
| Build | `pnpm build` |
| Start | `pnpm start` |
| Container | Dockerfile target `runner` · `CMD ["pnpm","start"]` |

## Ports

| Port | Use |
|------|-----|
| **3000** | Next.js app (TLS at Nginx on pilot) |

## Health / readiness

| Path | Purpose |
|------|---------|
| `/api/health` | Aggregate health JSON |
| `/api/readiness` | **503** if pilot Postgres/object storage unhealthy |
| Nginx | `/health`, `/readiness` proxy to above |

## Required public / app URL env

| Variable | Required (pilot) | Description |
|----------|------------------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | GPS HTTP API base |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | GPS Socket.IO base |
| `APP_URL` | Yes | Public HTTPS app URL |
| `DEPLOYMENT_MODE` | Yes | `pilot` |

Full matrix: `ENVIRONMENT-CONFIGURATION-MATRIX.md`.

## Runtime dependencies

- Modern browsers
- Outbound HTTPS to Carto/OSM tiles + MapLibre glyphs CDN
- Browser reachability to GPS Socket.IO URL

## Known limitations

- RC1 freeze — bugfix only
- Device lab / sleep-wake → joint pilot acceptance
- Docker runtime → **REQUIRES DUBAI SERVER VALIDATION**
