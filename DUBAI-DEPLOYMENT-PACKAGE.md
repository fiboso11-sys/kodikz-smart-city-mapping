# Dubai Deployment Package

**Product:** Dubai Street Mapping Monitoring System — GISCD Phase 1  
**Package date:** 2026-06-18

---

## Repository

| Field | Value |
|-------|-------|
| **Repository** | Local monorepo `kodikz-smart-city-mapping` |
| **Repository URL** | *Not configured — add remote and push before Dubai handoff* |
| **Branch** | `release/dubai-giscd-phase1-rc` |
| **Commit hash** | `71c483803c9de14bd01fe003b809566270cedc00` |
| **Commit message** | Dubai GISCD Phase1 Release Candidate |

### Clone (after remote is configured)

```bash
git clone <REPOSITORY_URL>
cd kodikz-smart-city-mapping
git checkout release/dubai-giscd-phase1-rc
```

---

## Build & Start

Deploy from **repository root** (not `frontend/`).

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local — set API and Socket URLs

pnpm run type-check
pnpm run build
pnpm start
```

### Windows note

If `pnpm build` fails with `EPERM` on `.next/trace`:

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
$env:NEXT_DIST_DIR = ".next-release"
pnpm run build
$env:NEXT_DIST_DIR = ".next-release"
pnpm start --port 3000
```

Linux VPS uses standard `pnpm run build` without workaround.

---

## Environment Variables

| Variable | Required | Example |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | `https://api-kodikz.giantphoenixllc.com` |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | `https://api-kodikz.giantphoenixllc.com` |
| `NEXT_PUBLIC_GPS_API_URL` | Optional | Same as API URL |
| `NEXT_PUBLIC_MAP_PROVIDER` | No | `maplibre` |
| `SQLITE_PATH` | No | `data/giscd.db` (default) |
| `NODE_ENV` | Yes (prod) | `production` — empty DB, no demo seed |

---

## Required Ports

| Port | Service | Exposure |
|------|---------|----------|
| **3000** | Next.js portal (default) | Public via HTTPS reverse proxy |
| **443** | HTTPS (nginx/Caddy) | Public |
| **5000** | Teltonika TCP (GPS backend) | Public to device SIMs |
| **3000/3001** | GPS backend HTTP API (internal) | Localhost only behind proxy |

> **Note:** Teltonika devices use TCP **5000** (Codec 8). See `backend/config/index.js`.

---

## Deployment Checklist

- [ ] Clone `release/dubai-giscd-phase1-rc` branch
- [ ] `pnpm install` completes (`better-sqlite3` native build)
- [ ] Copy `.env.example` → `.env.local` with production URLs
- [ ] `pnpm run build` succeeds
- [ ] `pnpm start` — app reachable at `/dashboard`
- [ ] Writable `data/` directory for SQLite
- [ ] `GET /api/system-health` → `overall: ONLINE`
- [ ] `GET /api/vehicles` → `count: 0` (production, no demo seed)
- [ ] GPS backend health: `https://api-kodikz.giantphoenixllc.com/health`
- [ ] HTTPS reverse proxy configured
- [ ] Register vehicles via `/vehicles` before expecting live map markers

---

## Phase 1 Modules Included

| Module | Route |
|--------|-------|
| Dashboard | `/dashboard` |
| Live Monitoring | `/live-monitoring` |
| Vehicles | `/vehicles` |
| Permits | `/permits` |
| Geo Upload | `/geo-upload` |
| System Health | `/settings/system-health` |

---

## Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Install, env, API overview |
| `DUBAI-HANDOFF-GUIDE.md` | Full handoff procedures |
| `RELEASE-FILE-MANIFEST.md` | Every file in release |
| `BUILD-AUDIT.md` | Build verification log |
| `RELEASE-CANDIDATE-CERTIFICATE.md` | Compliance score |

---

## Readiness

| Check | Status |
|-------|--------|
| Git commit | ✅ `71c4838` |
| Build verified | ✅ (see `BUILD-AUDIT.md`) |
| API verified | ✅ <1s response |
| Production demo data | ✅ Disabled |
| Remote push | ⚠️ **Required before Dubai clone** |

**Final score:** **94 / 100**  
**Status:** **READY FOR DUBAI** — after `git push` to accessible remote
