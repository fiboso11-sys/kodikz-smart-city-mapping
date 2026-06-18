# Dubai Release Package

**Project Name:** Dubai Street Mapping Monitoring System  
**Organization:** Dubai Municipality GISCD  
**Package type:** Phase 1 Pilot Release

---

## Release Identity

| Field | Value |
|-------|-------|
| **Release Branch** | `release/dubai-giscd-phase1-rc` |
| **Release Tag** | `v1.0-giscd-pilot` |
| **Release Commit** | `71c483803c9de14bd01fe003b809566270cedc00` |
| **Commit message** | Dubai GISCD Phase1 Release Candidate |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 + MapLibre GL JS + OpenStreetMap |
| **Backend (portal)** | Node.js API routes (Next.js server) |
| **GPS Backend** | Node.js + MongoDB + Teltonika TCP (separate `backend/` folder) |
| **Database (pilot)** | SQLite (`data/giscd.db`) |
| **Database (future)** | PostgreSQL / PostGIS ready (repository pattern) |
| **Realtime** | Socket.IO — event `location_update` |
| **Tracker** | Teltonika FMM130 (Codec 8) |

---

## External Services

| Service | URL |
|---------|-----|
| **GPS API** | `https://api-kodikz.giantphoenixllc.com` |
| **Socket.IO** | Same host as API URL |
| **Health check** | `GET /health` |

---

## Required Environment Variables

```env
NEXT_PUBLIC_API_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_SOCKET_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_MAP_PROVIDER=maplibre
```

Optional:

```env
SQLITE_PATH=./data/giscd.db
```

---

## Ports

| Port | Protocol | Service |
|------|----------|---------|
| **443** | HTTPS | Public web portal (reverse proxy) |
| **3000** | HTTP | Next.js app (internal / default) |
| **5000** | TCP | Teltonika FMM130 device ingress |
| **3000** | HTTP | GPS backend API (internal, behind proxy) |

---

## Deploy Commands

```bash
git clone <REPOSITORY_URL>
cd kodikz-smart-city-mapping
git checkout release/dubai-giscd-phase1-rc
git checkout v1.0-giscd-pilot

pnpm install
cp .env.example .env.local
# Edit .env.local

pnpm run type-check
pnpm run build
pnpm start
```

Deploy from **repository root** — not `frontend/`.

---

## Phase 1 Scope

| Module | Route |
|--------|-------|
| Executive Dashboard | `/dashboard` |
| Live Monitoring | `/live-monitoring` |
| Vehicle Master | `/vehicles` |
| Permit Master | `/permits` |
| Geo Upload | `/geo-upload` |
| System Health | `/settings/system-health` |

**Out of scope:** Violations engine, analytics, PostgreSQL (Phase 2).

---

## Included Documentation

| File | Purpose |
|------|---------|
| `README.md` | Installation and configuration |
| `DUBAI-HANDOFF-GUIDE.md` | Full deployment handoff |
| `DUBAI-TEAM-CHECKLIST.md` | Pilot rollout checklist |
| `RELEASE-FILE-MANIFEST.md` | Complete file list |
| `FINAL-BUILD-VERIFICATION.md` | Build/API proof |
| `FINAL-CERTIFICATION.md` | Release certification |

---

## Remote Status

**NO REMOTE CONFIGURED** — push required before Dubai team can clone.

```bash
git remote add origin <URL>
git push -u origin release/dubai-giscd-phase1-rc
git push origin v1.0-giscd-pilot
```
