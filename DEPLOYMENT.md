# Deployment Guide

## Repository

| Item | Value |
|------|--------|
| GitHub | `fiboso11-sys/kodikz-smart-city-mapping` |
| Release branch | `release/dubai-giscd-phase1-rc` |
| Release tag | `v1.0-giscd-pilot` |

## Vercel (Recommended for Pilot UI)

### Setup

1. Import repository in [Vercel](https://vercel.com)
2. **Root directory:** repository root (not `frontend/`)
3. **Framework:** Next.js (auto-detected)
4. **Build command:** `pnpm build`
5. **Install command:** `pnpm install`

### Environment Variables

Set in Vercel project settings (see [ENVIRONMENT.md](./ENVIRONMENT.md)):

```
NEXT_PUBLIC_API_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_SOCKET_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_MAP_PROVIDER=maplibre
```

### Vercel Considerations

| Topic | Detail |
|-------|--------|
| App Router | Supported |
| API routes | `runtime = nodejs` — compatible |
| `better-sqlite3` | Native module; listed in `serverExternalPackages` |
| SQLite persistence | **Ephemeral** on serverless — data resets between cold starts |
| Map tiles | CARTO CDN — no token required |
| GPS backend | External VPS — must be reachable from Vercel edge |

> For durable SQLite in production, deploy on VPS with persistent `data/` volume.

## VPS Deployment (Recommended for Production)

```bash
git clone https://github.com/fiboso11-sys/kodikz-smart-city-mapping.git
cd kodikz-smart-city-mapping
git checkout release/dubai-giscd-phase1-rc
pnpm install
cp .env.example .env.local
# edit .env.local

pnpm build
mkdir -p data
NODE_ENV=production pnpm start --port 3000
```

Use **nginx** or **Caddy** reverse proxy with HTTPS.

## Production Build

```bash
pnpm type-check
pnpm build
pnpm start
```

## Rollback

```bash
git fetch --tags
git checkout v1.0-giscd-pilot
pnpm install
pnpm build
pnpm start
```

Or redeploy previous Vercel deployment from dashboard.

## Health Check After Deploy

| Endpoint | Expected |
|----------|----------|
| `/dashboard` | 200 |
| `/api/system-health` | `overall: ONLINE` |
| `/api/vehicles/live` | `source: gps` |

## GitHub Release

Tag `v1.0-giscd-pilot` points to Phase 1 pilot. Attach [RELEASE-NOTES-v1.0-GISCD-PILOT.md](./RELEASE-NOTES-v1.0-GISCD-PILOT.md).
