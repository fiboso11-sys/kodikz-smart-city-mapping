# Build Audit

**Date:** 2026-06-18  
**Environment:** Windows 10, Node.js v20.20.2, pnpm v10.33.4  
**Project:** Dubai Street Mapping Monitoring System

---

## Results

| Step | Result | Duration | Notes |
|------|--------|----------|-------|
| **Install** | **PASS** | ~21s (force reinstall) | `better-sqlite3` native build succeeds via `pnpm.onlyBuiltDependencies` |
| **Type Check** | **PASS** | ~5s | `pnpm run type-check` — zero errors |
| **Build** | **PASS** | ~45s | 32 routes compiled; see notes below |
| **Start** | **PASS** | <3s | `pnpm start --port 3002` with `NEXT_DIST_DIR=.next-release` |

---

## Install

```bash
pnpm install
```

- Lockfile: `pnpm-lock.yaml` present
- Native module: `better-sqlite3@11.10.0` install script runs
- `package.json` includes `"pnpm": { "onlyBuiltDependencies": ["better-sqlite3"] }`

**Partial reinstall note:** `Remove-Item -Recurse node_modules` failed on Windows long paths. Recovery: `cmd /c "rmdir /s /q node_modules"` + `pnpm install --force` — **PASS**.

---

## Type Check

```bash
pnpm run type-check
# tsc --noEmit
```

Exit code: **0**

---

## Build

```bash
$env:NODE_ENV="production"
$env:NEXT_DIST_DIR=".next-release"   # Windows workaround — see below
pnpm run build
```

Exit code: **0**

### Route manifest (32 routes)

| Type | Count |
|------|-------|
| Static pages | 22 |
| Dynamic API routes | 11 |
| Root redirect | 1 |

Key API routes built:
- `/api/vehicles`
- `/api/permits`
- `/api/system-health`
- `/api/vehicles/live`
- `/api/geo-uploads`
- `/api/gps/health`

### Windows `.next` lock issue

Standard `pnpm run build` (distDir `.next`) fails with:

```
EPERM: operation not permitted, open '.next/trace'
```

**Root cause:** Stale `.next/trace` file locked by prior Node/Next process on Windows.

**Workaround verified:**

```powershell
Get-Process -Name node | Stop-Process -Force
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
$env:NEXT_DIST_DIR=".next-release"
pnpm run build
```

**Linux/VPS deploy:** Standard `pnpm run build` expected to work without workaround.

---

## Start

```bash
$env:NODE_ENV="production"
$env:NEXT_DIST_DIR=".next-release"
pnpm start --port 3002
```

Output:

```
▲ Next.js 15.5.18
- Local: http://localhost:3002
✓ Ready
```

Exit code on launch: **0** (server running)

---

## API Startup Verification (post-build)

All routes responded **under 2 seconds** on production server:

| Route | Result | Latency |
|-------|--------|---------|
| `GET /api/vehicles` | PASS | 282 ms |
| `GET /api/permits` | PASS | 8 ms |
| `GET /api/system-health` | PASS | 948 ms |
| `GET /api/vehicles/live` | PASS | 287 ms |

### Root cause of prior API timeouts (resolved)

| Issue | Fix |
|-------|-----|
| Dev server stuck at `Starting...` | Use **production** `pnpm start` after successful build |
| `EPERM` on `.next/trace` blocking compile | Kill Node processes; use alternate `NEXT_DIST_DIR` |
| `system-health` importing client `gps-service` | Replaced with inline `fetch` + 5s abort timeout |
| SQLite routes not on Node runtime | Added `export const runtime = "nodejs"` to API routes |

---

## Production demo data

With `NODE_ENV=production`:

```
GET /api/vehicles → count: 0
GET /api/permits  → count: 0
```

Seed data loads **only** when `NODE_ENV=development`.

---

## Overall build status

| Check | Status |
|-------|--------|
| Install | **PASS** |
| Type Check | **PASS** |
| Build | **PASS** |
| Start | **PASS** |

**Build audit: PASS** (with documented Windows `.next` workaround)
