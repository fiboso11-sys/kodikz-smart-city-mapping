# Environment Variables

All configuration for the Dubai Street Mapping Monitoring System portal.

## Quick Start

```bash
cp .env.example .env.local
```

## Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Recommended | `https://api-kodikz.giantphoenixllc.com` | GPS REST API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Recommended | Same as `NEXT_PUBLIC_API_URL` | Socket.IO server URL |
| `NEXT_PUBLIC_GPS_API_URL` | Optional | Falls back to `NEXT_PUBLIC_API_URL` | Legacy alias for API URL |
| `NEXT_PUBLIC_MAP_PROVIDER` | Optional | `maplibre` | Map engine identifier |
| `SQLITE_PATH` | Optional | `./data/giscd.db` | SQLite database file path |
| `DATABASE_URL` | Phase 2 | — | PostgreSQL connection string |
| `NEXT_DIST_DIR` | Optional | `.next` | Custom Next.js output directory |
| `NODE_ENV` | Auto | `development` / `production` | Controls demo seed (dev only) |

## Behavior When Missing

| Scenario | Behavior |
|----------|----------|
| No `NEXT_PUBLIC_*` URLs set | App uses production VPS default in `src/lib/config.ts` |
| GPS backend unreachable | Connection header shows **DISCONNECTED**; master data still loads |
| SQLite unavailable | Repositories fall back to in-memory storage |
| `NODE_ENV=production` | No demo seed; empty database on first run |

## Vercel

Set these in **Project → Settings → Environment Variables**:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`
- `NEXT_PUBLIC_MAP_PROVIDER=maplibre`

> **Note:** Vercel serverless has ephemeral filesystem. SQLite persists only within a single instance lifecycle. For durable production data, use VPS deployment or Phase 2 PostgreSQL.

## Security

- Never commit `.env` or `.env.local`
- All `NEXT_PUBLIC_*` variables are exposed to the browser by design
- Do not put secrets in `NEXT_PUBLIC_*` variables
