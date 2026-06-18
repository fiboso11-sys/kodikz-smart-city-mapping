# Dubai Street Mapping Monitoring System

**Dubai Municipality GIS Center Department (GISCD)**  
Street Mapping Monitoring & Compliance Platform — Phase 1

Government-grade Web GIS command center for monitoring street mapping companies operating under official Dubai Municipality permits. Connects to live Teltonika FMM130 GPS data via the production VPS backend.

---

## Phase 1 Modules

| Module | Route | Status |
|--------|-------|--------|
| Executive Dashboard | `/dashboard` | Live |
| Live Monitoring | `/live-monitoring` | Live |
| Vehicle Master | `/vehicles` | CRUD |
| Permit Master | `/permits` | CRUD |
| Geo Upload | `/geo-upload` | GeoJSON |
| Settings | `/settings` | Live |
| System Health | `/settings/system-health` | Live |
| Route / Area / Violations / Analytics / Reports | — | Phase 2 |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 App Router · TypeScript · Tailwind CSS |
| Map | **MapLibre GL JS** + OpenStreetMap (Street + Humanitarian basemaps) |
| Persistence | **SQLite** (`data/giscd.db`) — repository pattern, PostGIS-ready |
| Live GPS | **Socket.IO** `location_update` + REST polling |
| State | Zustand + TanStack Query |

**No Mapbox token required.**

---

## Architecture

```
Teltonika FMM130 (Codec 8, TCP :5000)
         ↓
VPS GPS Backend — REST + Socket.IO
         ↓
Next.js Portal (this app)
         ↓
Dashboard · Live Map · CRUD · GeoJSON · SQLite
```

---

## Installation

```bash
pnpm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SOCKET_URL

pnpm run build
pnpm start
```

Development:

```bash
pnpm dev
```

Open **http://localhost:3000/dashboard**

> Demo seed data (5 vehicles, 4 permits) loads **only** when `NODE_ENV=development`. Production starts with an empty database.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | GPS REST API e.g. `https://api-kodikz.giantphoenixllc.com` |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Socket.IO server (usually same as API URL) |
| `NEXT_PUBLIC_GPS_API_URL` | Optional | Legacy alias for API URL |
| `NEXT_PUBLIC_MAP_PROVIDER` | Optional | `maplibre` (default) |
| `SQLITE_PATH` | Optional | Custom DB path (default: `data/giscd.db`) |
| `DATABASE_URL` | Phase 2 | PostgreSQL + PostGIS |

Example `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_SOCKET_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_MAP_PROVIDER=maplibre
```

---

## GPS Backend Integration

1. Deploy [kodikz-gps-backend](https://github.com/fiboso11-sys/kodikz-gps-backend) on VPS
2. Configure FMM130 devices: **Codec 8**, TCP port **5000**
3. Register IMEIs in **Vehicle Master** (`/vehicles`)
4. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL`
5. Live map receives `location_update` via Socket.IO + REST fallback every 5s

### External API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health |
| GET | `/vehicles` or `/vehicles/live` | Live fleet snapshot |
| GET | `/vehicle/:imei` | Single device |
| GET | `/history/:imei` | Position history |

### Socket.IO

- **Event:** `location_update`
- **Payload:** `{ imei, latitude, longitude, speed, heading, timestamp, ... }`

---

## API Routes (Next.js)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/vehicles` | Vehicle master list / create |
| GET/PUT/DELETE | `/api/vehicles/:id` | Vehicle CRUD |
| GET | `/api/vehicles/live` | Fleet + GPS merge |
| GET/POST | `/api/permits` | Permit list / create |
| GET/PUT/DELETE | `/api/permits/:id` | Permit CRUD |
| POST | `/api/permits/:id/upload-route` | GeoJSON route upload |
| POST | `/api/permits/:id/upload-area` | GeoJSON area upload |
| GET | `/api/geo-uploads` | Uploaded layers |
| GET | `/api/system-health` | Module status dashboard |
| GET | `/api/gps/health` | Proxied GPS health |

---

## Build & Deploy

```bash
pnpm run type-check
pnpm run build
pnpm start
```

**VPS / Docker:**

- Node.js 20+
- Writable `data/` directory for SQLite
- Reverse proxy (nginx/Caddy) with HTTPS
- Set production env vars on host

**Vercel:** set root directory to project root, add env vars, deploy. Note: SQLite requires a persistent volume — VPS is recommended for production.

---

## Phase 2 Roadmap

- PostgreSQL + PostGIS persistence
- Route compliance & violation engine
- SHP / KML / GDB upload
- Analytics & executive reports
- SSO / Dubai Municipality identity integration

---

## License

Proprietary — Dubai Municipality GISCD / licensed deployment only.
