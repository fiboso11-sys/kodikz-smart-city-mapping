# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Dubai Municipality Operators                          │
│                         (Web Browser)                                    │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Next.js 15 Portal (this repository)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Dashboard   │  │ Live Monitor │  │ CRUD Masters │  │ Geo Upload  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                  │                  │        │
│  ┌──────┴─────────────────┴──────────────────┴──────────────────┴──────┐ │
│  │ MapLibre GL JS + CARTO Basemap │ Zustand │ TanStack Query            │ │
│  └──────────────────────────────┬──────────────────────────────────────┘ │
│                                 │                                         │
│  ┌──────────────────────────────┴──────────────────────────────────────┐ │
│  │ App Router API Routes (/api/*)  —  runtime: nodejs                  │ │
│  └──────────────────────────────┬──────────────────────────────────────┘ │
│                                 │                                         │
│  ┌──────────────────────────────┴──────────────────────────────────────┐ │
│  │ Repository Layer → SQLite (better-sqlite3) / in-memory fallback     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ REST + Socket.IO
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│           VPS GPS Backend — api-kodikz.giantphoenixllc.com              │
│           REST /health /vehicles /history  +  Socket.IO location_update │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ TCP :5000 Codec 8
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Teltonika FMM130 GPS Devices                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Frontend (`src/`)

| Layer | Location | Role |
|-------|----------|------|
| App Router | `src/app/` | Pages and API routes |
| Platform UI | `src/app/(platform)/` | Phase 1 operational modules |
| Components | `src/components/` | Maps, dashboard, shared UI |
| State | `src/store/gis-store.ts` | Live GPS, basemap, filters |
| Services | `src/services/` | GPS REST client, Socket.IO provider |
| Config | `src/lib/config.ts` | Env resolution, Dubai map center |

## Backend (External VPS)

Not in this repo. Consumed via:

- `NEXT_PUBLIC_API_URL` — REST
- `NEXT_PUBLIC_SOCKET_URL` — Socket.IO

## SQLite

- File: `data/giscd.db` (configurable via `SQLITE_PATH`)
- WAL mode, `busy_timeout = 3000`
- Schema: vehicles, permits, geo_uploads
- **Seed data:** development only (`NODE_ENV=development`)
- **Fallback:** in-memory repository if SQLite init fails

## Socket.IO Realtime Flow

1. `LiveGpsProvider` connects to `getSocketUrl()`
2. Listens for `location_update` events
3. Updates `gis-store` `liveByImei` map
4. REST poll every 5s as fallback (`/api/vehicles/live`)
5. Connection header reflects CONNECTED / RECONNECTING / DISCONNECTED

## API Flow

```
Browser → /api/vehicles/live
       → fetchLiveFromGpsBackend() (VPS)
       → mergeLivePositions() with SQLite master
       → JSON response
```

## Map Flow

1. `MapView` initializes MapLibre with CARTO raster style
2. Vehicle GeoJSON source with clustering
3. Route/area layers from `geo_uploads` table
4. Basemap switch via Zustand `basemap` state

## Deployment Flow

```
GitHub (release branch) → Vercel / VPS
                        → env vars set
                        → pnpm build
                        → pnpm start (VPS) or Vercel serverless
```

## Legacy / Non-Production Paths

| Item | Status |
|------|--------|
| Root `frontend/` / `backend/` copies | **Removed from Git** (Phase 6.2) — do not recreate for RC1 |
| GPS “backend” | External Dubai-managed VPS only (`NEXT_PUBLIC_API_URL`) |
| `src/components/map/`, `src/store/app-store.ts` | Legacy simulator code — not wired to Phase 1 routes |

## Phase 2 Extension Points

- `DATABASE_URL` → PostgreSQL + PostGIS repository
- Violations engine (`src/lib/violations.ts` stub exists)
- Additional upload formats (SHP, KML, GDB)
