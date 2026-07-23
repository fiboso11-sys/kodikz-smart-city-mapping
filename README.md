# Kodikz Smart City Mapping & Survey Guidance Platform

**Current release:** **Version 1.0.0 RC1** · Tag `v1.0.0-rc1` · Freeze commit `8612a33f03db738cffc0bfd6bd089abe3f8fd414`

| Audience | Start here |
|----------|------------|
| Dubai Infrastructure (deploy) | [`handover/RC1-1.0.0/QUICK-START.md`](./handover/RC1-1.0.0/QUICK-START.md) |
| Dubai operators (support) | [`handover/RC1-1.0.0/OPERATOR-SUPPORT-GUIDE.md`](./handover/RC1-1.0.0/OPERATOR-SUPPORT-GUIDE.md) |
| Collaborators (GitHub) | [`CONTRIBUTING.md`](./CONTRIBUTING.md) · [`COLLABORATION-POLICY.md`](./COLLABORATION-POLICY.md) |
| Release notes | [`RELEASE-NOTES.md`](./RELEASE-NOTES.md) · [`CHANGELOG.md`](./CHANGELOG.md) |
| Known limitations | [`KNOWN-LIMITATIONS.md`](./KNOWN-LIMITATIONS.md) |

Dubai Municipality GISCD — Street Mapping Monitoring, Survey Guidance, and Compliance (Phase 1 + Survey RC1).

---

# Dubai Street Mapping Monitoring System (Phase 1 baseline)

**Dubai Municipality GIS Center Department (GISCD)**  
Street Mapping Monitoring & Compliance Platform — Phase 1 Pilot (foundation for RC1)

[![Release](https://img.shields.io/badge/release-v1.0.0--rc1-blue)](./RELEASE-NOTES.md)
[![Branch](https://img.shields.io/badge/branch-phase2%2Fdubai--giscd--enhancements-green)](https://github.com/fiboso11-sys/kodikz-smart-city-mapping/tree/phase2/dubai-giscd-enhancements)

Government-grade Web GIS command center for monitoring street mapping companies operating under official Dubai Municipality permits. Connects to live Teltonika FMM130 GPS data via the production VPS backend.

**Repository:** [fiboso11-sys/kodikz-smart-city-mapping](https://github.com/fiboso11-sys/kodikz-smart-city-mapping)

---

## Project Overview

| Item | Detail |
|------|--------|
| **Frontend** | Next.js 15 + TypeScript + Tailwind |
| **Map** | MapLibre GL JS + CARTO English basemaps |
| **Database** | SQLite (`data/giscd.db`) |
| **Realtime** | Socket.IO `location_update` |
| **GPS Backend** | `https://api-kodikz.giantphoenixllc.com` |
| **Timezone** | Asia/Dubai (all UI timestamps) |

---

## Architecture

```
Teltonika FMM130 → VPS GPS Backend → Next.js Portal → Dashboard / Map / CRUD
                                         ↓
                                    SQLite (master data)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full diagrams and data flows.

---

## Folder Structure

```
kodikz-smart-city-mapping/
├── src/
│   ├── app/                    # Next.js App Router (pages + API)
│   │   ├── (platform)/         # Phase 1 operational modules
│   │   └── api/                # REST API routes
│   ├── components/             # UI, maps, dashboard
│   ├── hooks/                  # React Query hooks
│   ├── lib/                    # Config, DB, geo, time, repositories
│   ├── services/               # GPS client, Socket.IO provider
│   ├── store/                  # Zustand (gis-store)
│   └── types/                  # TypeScript types
├── data/                       # SQLite (gitignored)
├── scripts/                    # Seed generator
├── .github/                    # PR/issue templates, CODEOWNERS
├── handover/RC1-1.0.0/         # Plug-and-play Dubai handover package
├── .env.example                # Environment template
└── docs: README, INSTALLATION, CONTRIBUTING, API, DEPLOYMENT, ...
```

> Obsolete `frontend/` and `backend/` directory copies were **removed from Git** in Phase 6.2. Deploy and develop from the **repository root** only. Live GPS remains the Dubai-managed VPS (`NEXT_PUBLIC_API_URL` / Socket.IO).

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

---

## Quick Start

```bash
git clone https://github.com/fiboso11-sys/kodikz-smart-city-mapping.git
cd kodikz-smart-city-mapping
git checkout release/dubai-giscd-phase1-rc
pnpm install
cp .env.example .env.local
pnpm dev
```

Open **http://localhost:3000/dashboard**

Full guide: [INSTALLATION.md](./INSTALLATION.md)

---

## Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Recommended | `https://api-kodikz.giantphoenixllc.com` |
| `NEXT_PUBLIC_SOCKET_URL` | Recommended | Same as API URL |
| `NEXT_PUBLIC_GPS_API_URL` | Optional | Alias for API URL |
| `NEXT_PUBLIC_MAP_PROVIDER` | Optional | `maplibre` |
| `SQLITE_PATH` | Optional | `./data/giscd.db` |

Full reference: [ENVIRONMENT.md](./ENVIRONMENT.md)

---

## Build & Run

```bash
pnpm type-check
pnpm build
pnpm start
```

**Windows EPERM workaround:**

```powershell
$env:NEXT_DIST_DIR = ".next-release"
pnpm build && pnpm start
```

---

## Deploy

| Target | Guide |
|--------|-------|
| Vercel | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| VPS | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Dubai handoff | [DUBAI-DEPLOYMENT-PACKAGE.md](./DUBAI-DEPLOYMENT-PACKAGE.md) |

---

## GPS Backend

| Type | Endpoint |
|------|----------|
| REST | `GET /health`, `GET /vehicles`, `GET /history/:imei` |
| Socket.IO | Event `location_update` on `/socket.io` |

Portal API docs: [API.md](./API.md)

---

## Database

- SQLite file at `data/giscd.db`
- Demo seed (5 vehicles, 4 permits) loads **only** in `NODE_ENV=development`
- Production starts with empty database
- Falls back to in-memory if SQLite unavailable

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| GPS disconnected | Check `NEXT_PUBLIC_API_URL`, VPS health |
| Client crash after rebuild | Stop server, rebuild, restart |
| Map labels wrong language | Use CARTO English Street basemap (default) |
| Times show wrong timezone | All UI uses `Asia/Dubai` via `src/lib/time.ts` |
| Empty fleet in production | Register vehicles in Vehicle Master |

---

## Git Workflow

| Branch | Purpose |
|--------|---------|
| `release/dubai-giscd-phase1-rc` | Phase 1 release line |
| `feature/*` | New work |
| `fix/*` | Bug fixes |

See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| [INSTALLATION.md](./INSTALLATION.md) | Clone, install, run |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Branch strategy, PRs |
| [COLLABORATION.md](./COLLABORATION.md) | GitHub collaboration |
| [BRANCH-PROTECTION.md](./BRANCH-PROTECTION.md) | Branch protection setup |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design |
| [API.md](./API.md) | All endpoints |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel / VPS |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Env variables |
| [RELEASE-NOTES-v1.0-GISCD-PILOT.md](./RELEASE-NOTES-v1.0-GISCD-PILOT.md) | Release notes |
| [GITHUB-HANDOFF-SUMMARY.md](./GITHUB-HANDOFF-SUMMARY.md) | GitHub handoff |
| [DUBAI-HANDOFF-CHECKLIST.md](./DUBAI-HANDOFF-CHECKLIST.md) | Dubai team checklist |
| [FINAL-E2E-RELEASE-AUDIT.md](./FINAL-E2E-RELEASE-AUDIT.md) | Final audit |
| [RELEASE-CANDIDATE-REPORT.md](./RELEASE-CANDIDATE-REPORT.md) | RC1 report |

---

## License

Proprietary — Dubai Municipality GISCD / licensed deployment only.
