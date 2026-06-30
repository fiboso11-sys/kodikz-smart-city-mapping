# Dubai Team Handoff Checklist

**System:** Dubai Street Mapping Monitoring System (GISCD Phase 1)  
**Handoff date:** 2026-06-18  
**Release candidate:** RC1 (`v1.0-giscd-rc1` recommended)

---

## Repository

| Item | Value |
|------|--------|
| **URL** | https://github.com/fiboso11-sys/kodikz-smart-city-mapping |
| **Branch** | `release/dubai-giscd-phase1-rc` |
| **Pilot tag** | `v1.0-giscd-pilot` (historical — do not move) |
| **RC1 tag** | `v1.0-giscd-rc1` (recommended after RC1 commit) |

---

## 1. Clone

```bash
git clone https://github.com/fiboso11-sys/kodikz-smart-city-mapping.git
cd kodikz-smart-city-mapping
git checkout release/dubai-giscd-phase1-rc
git pull origin release/dubai-giscd-phase1-rc
```

---

## 2. Install

```bash
pnpm install
```

**Requirements:** Node.js 20+, pnpm 10+

---

## 3. Environment

```bash
cp .env.example .env.local
```

**Production values:**

```env
NEXT_PUBLIC_API_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_SOCKET_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_GPS_API_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_MAP_PROVIDER=maplibre
```

See [ENVIRONMENT.md](./ENVIRONMENT.md).

---

## 4. Build

```bash
pnpm type-check
pnpm build
```

**Windows EPERM:**

```powershell
$env:NEXT_DIST_DIR = ".next-release"
pnpm build
```

---

## 5. Run

```bash
pnpm start
# Open http://localhost:3000/dashboard
```

**Development (demo seed data):**

```bash
pnpm dev
```

---

## 6. Backend

| Item | Value |
|------|--------|
| **GPS API** | https://api-kodikz.giantphoenixllc.com |
| **Health** | https://api-kodikz.giantphoenixllc.com/health |
| **Socket.IO** | Same host, event `location_update` |
| **Teltonika TCP** | Port 5000, Codec 8 |

**Portal health:** `GET /api/system-health` → expect `overall: ONLINE`

---

## 7. Vercel Deployment

1. Import repo in Vercel
2. Root directory: **`.`** (not `frontend/`)
3. Set env vars (section 3)
4. Deploy

> SQLite is ephemeral on Vercel serverless. Use VPS for durable master data.

Full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 8. Verification Checklist

- [ ] `/dashboard` loads with CARTO English map
- [ ] Header shows **Dubai Time**
- [ ] GPS status **CONNECTED** when VPS reachable
- [ ] Vehicle Master — add/edit vehicle
- [ ] Permit Master — add/edit permit
- [ ] Geo Upload — valid GeoJSON route/area
- [ ] System Health — all modules ONLINE
- [ ] `/api/vehicles/live` returns `source: gps`

---

## 9. Pull Request Workflow

1. Create `feature/*` or `fix/*` branch
2. Open PR to `release/dubai-giscd-phase1-rc`
3. CI **Build** must pass
4. 1 approval required (after branch protection enabled)
5. Squash merge

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [BRANCH-PROTECTION.md](./BRANCH-PROTECTION.md).

---

## 10. Troubleshooting

| Issue | Fix |
|-------|-----|
| GPS disconnected | Check env URLs; verify VPS `/health` |
| Empty fleet | Register vehicles in Vehicle Master |
| Map tiles blank | Check outbound HTTPS to CARTO CDN |
| Client crash after deploy | Hard refresh; redeploy clean build |
| Wrong timezone | All UI uses `Asia/Dubai` — hard refresh cache |
| `better-sqlite3` install fail | Install build tools; re-run `pnpm install` |

---

## 11. Documentation Index

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | Overview |
| [INSTALLATION.md](./INSTALLATION.md) | Setup |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design |
| [API.md](./API.md) | Endpoints |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel / VPS |
| [RELEASE-NOTES-v1.0-GISCD-PILOT.md](./RELEASE-NOTES-v1.0-GISCD-PILOT.md) | Release notes |
| [RELEASE-CANDIDATE-REPORT.md](./RELEASE-CANDIDATE-REPORT.md) | RC1 report |

---

## 12. Support Contact

| Role | Contact |
|------|---------|
| **Technical lead (India)** | _[Add name / email]_ |
| **Dubai GISCD operator** | _[Add name / email]_ |
| **GitHub issues** | https://github.com/fiboso11-sys/kodikz-smart-city-mapping/issues |

---

**Status:** Ready for Dubai pilot handoff after RC1 push and Vercel env configuration.
