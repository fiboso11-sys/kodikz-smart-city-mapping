# Dubai Deployment Package

**Product:** Dubai Street Mapping Monitoring System — GISCD Phase 1  
**Package date:** 2026-06-18  
**Release:** `v1.0-giscd-pilot`  
**Confidence:** 96/100

---

## Repository

| Field | Value |
|-------|-------|
| **GitHub** | https://github.com/fiboso11-sys/kodikz-smart-city-mapping |
| **Branch** | `release/dubai-giscd-phase1-rc` |
| **Tag** | `v1.0-giscd-pilot` |
| **Deploy from** | Repository root (`src/`) — **not** `frontend/` |

### Clone

```bash
git clone https://github.com/fiboso11-sys/kodikz-smart-city-mapping.git
cd kodikz-smart-city-mapping
git checkout release/dubai-giscd-phase1-rc
```

---

## Build & Start

```bash
pnpm install
cp .env.example .env.local
pnpm type-check
pnpm build
pnpm start
```

### Windows EPERM

```powershell
$env:NEXT_DIST_DIR = ".next-release"
pnpm build
pnpm start --port 3000
```

---

## Environment Variables (Production)

```env
NEXT_PUBLIC_API_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_SOCKET_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_MAP_PROVIDER=maplibre
NODE_ENV=production
```

See [ENVIRONMENT.md](./ENVIRONMENT.md).

---

## Vercel Deployment

1. Import `fiboso11-sys/kodikz-smart-city-mapping`
2. Root directory: `.` (project root)
3. Set env vars above
4. Deploy

> SQLite is ephemeral on Vercel serverless. Use VPS for durable master data or Phase 2 PostgreSQL.

Full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## VPS Deployment (Recommended)

| Requirement | Detail |
|-------------|--------|
| Node.js | 20+ |
| pnpm | 10+ |
| Disk | Writable `data/` for SQLite |
| HTTPS | nginx / Caddy reverse proxy |
| Ports | 443 public, 3000 internal |

---

## GPS Backend

| Service | URL |
|---------|-----|
| REST + Socket.IO | `https://api-kodikz.giantphoenixllc.com` |
| Teltonika TCP | Port **5000**, Codec 8 |

---

## Phase 1 Features Delivered

- Executive GIS Dashboard
- Live Monitoring + Socket.IO
- Vehicle Master / Permit Master CRUD
- GeoJSON Upload (routes + areas)
- System Health dashboard
- MapLibre + CARTO English basemap
- Dubai timezone (Asia/Dubai)
- SQLite persistence

---

## Known Limitations (Phase 2)

- PostgreSQL/PostGIS
- Violations module
- Analytics & reports
- SHP/KML/GDB upload

---

## Verification Checklist

- [ ] `/dashboard` loads with Dubai map
- [ ] Header shows **Dubai Time**
- [ ] `/api/system-health` → `overall: ONLINE`
- [ ] GPS header → CONNECTED when VPS reachable
- [ ] Vehicle Master CRUD works
- [ ] Permit Master CRUD works
- [ ] Geo Upload accepts valid GeoJSON

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [README.md](./README.md) | Overview |
| [INSTALLATION.md](./INSTALLATION.md) | Setup |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel/VPS |
| [API.md](./API.md) | Endpoints |
| [RELEASE-NOTES-v1.0-GISCD-PILOT.md](./RELEASE-NOTES-v1.0-GISCD-PILOT.md) | Release notes |

**Status:** Approved for Dubai Pilot Deployment
