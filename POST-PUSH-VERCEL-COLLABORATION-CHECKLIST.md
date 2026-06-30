# Post-Push Vercel & Collaboration Checklist

**Project:** Dubai Street Mapping Monitoring System (Kodikz Smart City Mapping)  
**Repository:** https://github.com/fiboso11-sys/kodikz-smart-city-mapping  
**Branch:** `release/dubai-giscd-phase1-rc`  
**RC1 tag:** `v1.0-giscd-rc1`  
**Pilot tag (unchanged):** `v1.0-giscd-pilot`  
**Checklist date:** 2026-06-30  
**RC1 commit:** `bdb18866097e2e116346145844a1c17c4efd40b2`

---

## 1. GitHub Remote Status — VERIFIED ✅

| Check | Status | Evidence |
|-------|--------|----------|
| Branch on origin | ✅ PASS | `origin/release/dubai-giscd-phase1-rc` → `bdb1886` |
| Tag `v1.0-giscd-rc1` on origin | ✅ PASS | Annotated tag → commit `bdb1886` |
| Tag `v1.0-giscd-pilot` unchanged | ✅ PASS | Still → commit `71c4838` |
| Latest commit | ✅ PASS | `bdb1886` — *release: finalize RC1 for Dubai collaboration* |
| Local working tree | ✅ PASS | Clean, up to date with origin |

**Branch URL:** https://github.com/fiboso11-sys/kodikz-smart-city-mapping/tree/release/dubai-giscd-phase1-rc  
**RC1 tag URL:** https://github.com/fiboso11-sys/kodikz-smart-city-mapping/releases/tag/v1.0-giscd-rc1

---

## 2. Branch Protection Checklist — MANUAL (GitHub UI)

**Navigate:** Repository → **Settings** → **Branches** → **Add branch protection rule**  
**Pattern:** `release/dubai-giscd-phase1-rc`

Copy this checklist when configuring:

| # | Setting | Enable? | Value |
|---|---------|---------|-------|
| 1 | Require a pull request before merging | ✅ | On |
| 2 | Required approvals | ✅ | **1** |
| 3 | Dismiss stale pull request approvals when new commits are pushed | ✅ | On |
| 4 | Require review from Code Owners | ✅ | On (after Dubai handles added to CODEOWNERS) |
| 5 | Require status checks to pass before merging | ✅ | On |
| 6 | Require branches to be up to date before merging | ✅ | On |
| 7 | Require conversation resolution before merging | ✅ | On |
| 8 | Do not allow bypassing the above settings | ✅ | On |
| 9 | Status check required | ✅ | **`Type-check and Build`** |
| 10 | Allow force pushes | ❌ | Off |
| 11 | Allow deletions | ❌ | Off |
| 12 | Restrict who can push to matching branches | ✅ | Maintainers / release managers only |

### Enable status check (after first CI run)

CI has already run successfully on RC1 push. In branch protection:

1. Search status checks for: **`Type-check and Build`**
2. Select it as required
3. Save rule

Full guide: [BRANCH-PROTECTION.md](./BRANCH-PROTECTION.md)

---

## 3. CI Status — VERIFIED ✅

| Item | Status |
|------|--------|
| Workflow file | ✅ `.github/workflows/build.yml` |
| Trigger | push + pull_request on `release/dubai-giscd-phase1-rc`, `master` |
| Steps | `pnpm install --frozen-lockfile` → `pnpm type-check` → `pnpm build` |
| Latest run | ✅ **SUCCESS** (workflow: Build, run on RC1 push) |
| Auto-deploy | ❌ Disabled (by design) |

**Actions URL:** https://github.com/fiboso11-sys/kodikz-smart-city-mapping/actions

---

## 4. Vercel Deployment Checklist — PENDING ⏳

### Import project

| Step | Action |
|------|--------|
| 1 | Log in to [Vercel](https://vercel.com) |
| 2 | **Add New** → **Project** → Import `fiboso11-sys/kodikz-smart-city-mapping` |
| 3 | **Production branch:** `release/dubai-giscd-phase1-rc` |
| 4 | **Root directory:** `.` (repository root — **not** `frontend/`) |
| 5 | **Framework:** Next.js (auto-detected) |
| 6 | **Build command:** `pnpm build` |
| 7 | **Install command:** `pnpm install` |
| 8 | Deploy |

### Environment variables (Production + Preview)

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://api-kodikz.giantphoenixllc.com` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://api-kodikz.giantphoenixllc.com` |
| `NEXT_PUBLIC_GPS_API_URL` | `https://api-kodikz.giantphoenixllc.com` |
| `NEXT_PUBLIC_MAP_PROVIDER` | `maplibre` |

> Do **not** set `NODE_ENV` manually — Vercel sets `production` automatically.

### Vercel notes

| Topic | Guidance |
|-------|----------|
| SQLite | Ephemeral on serverless — master data may reset on cold start |
| API routes | Use Node.js runtime; `better-sqlite3` in `serverExternalPackages` |
| Map tiles | CARTO CDN — no token |
| GPS | External VPS — must be publicly reachable |

Full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 5. Post-Deployment Smoke Test — PENDING ⏳

Run after Vercel deploy. Replace `{VERCEL_URL}` with your deployment URL.

### Pages

| Route | Expected | ☐ |
|-------|----------|---|
| `{VERCEL_URL}/` | Redirects to `/dashboard` | ☐ |
| `{VERCEL_URL}/dashboard` | Map loads, Dubai Time in header | ☐ |
| `{VERCEL_URL}/live-monitoring` | Map + vehicle table | ☐ |
| `{VERCEL_URL}/vehicles` | Vehicle Master CRUD UI | ☐ |
| `{VERCEL_URL}/permits` | Permit Master CRUD UI | ☐ |
| `{VERCEL_URL}/geo-upload` | Upload wizard | ☐ |
| `{VERCEL_URL}/settings` | Integration settings | ☐ |
| `{VERCEL_URL}/settings/system-health` | All modules ONLINE | ☐ |

### Portal APIs (on Vercel URL)

| Endpoint | Expected | ☐ |
|----------|----------|---|
| `/api/system-health` | `overall: ONLINE` | ☐ |
| `/api/vehicles` | HTTP 200 JSON | ☐ |
| `/api/permits` | HTTP 200 JSON | ☐ |
| `/api/vehicles/live` | `source: gps` | ☐ |

### External GPS backend — VERIFIED ✅ (pre-deploy)

| Endpoint | Status |
|----------|--------|
| `https://api-kodikz.giantphoenixllc.com/health` | ✅ `status: ok`, `socketIo: true` |

### Functional checks on Vercel

| Check | ☐ |
|-------|---|
| GPS header shows CONNECTED | ☐ |
| CARTO English map labels visible | ☐ |
| Times display **Dubai Time** | ☐ |
| Socket.IO live updates (if devices reporting) | ☐ |

---

## 6. Dubai / India Collaborator Onboarding

### One-time setup

```bash
git clone https://github.com/fiboso11-sys/kodikz-smart-city-mapping.git
cd kodikz-smart-city-mapping
git checkout release/dubai-giscd-phase1-rc
git pull origin release/dubai-giscd-phase1-rc
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000/dashboard

### Contributing workflow

```bash
# Never push directly to release branch
git checkout release/dubai-giscd-phase1-rc
git pull
git checkout -b feature/your-change-name

# Make changes, then:
pnpm type-check
pnpm build

git add .
git commit -m "feat: describe your change"
git push origin feature/your-change-name
```

1. Open **Pull Request** → base: `release/dubai-giscd-phase1-rc`
2. Wait for CI **Build** to pass
3. Request review — **1 approval** required (after branch protection enabled)
4. Squash merge

### Rules

- ❌ Do **not** push directly to `release/dubai-giscd-phase1-rc`
- ❌ Do **not** force-push or delete the release branch
- ❌ Do **not** move tag `v1.0-giscd-pilot`
- ✅ Use feature/fix/docs branches + PRs
- ✅ Deploy from repository **root** only

Guides: [CONTRIBUTING.md](./CONTRIBUTING.md) · [COLLABORATION.md](./COLLABORATION.md)

### Add collaborators (admin task)

GitHub → **Settings** → **Collaborators** → Add people:

| Team | Suggested role |
|------|----------------|
| India developers | Write |
| Dubai GISCD | Read (or Write if contributing) |
| Release manager | Admin |

Update [.github/CODEOWNERS](./.github/CODEOWNERS) with Dubai team GitHub usernames.

---

## 7. Final Readiness Status

| Area | Status |
|------|--------|
| GitHub branch/tag | ✅ **READY** |
| RC1 pushed | ✅ **COMPLETE** |
| CI workflow | ✅ **PASSING** |
| Branch protection | ⏳ **MANUAL** — enable in GitHub Settings |
| Vercel deploy | ⏳ **PENDING** — import + env vars |
| Post-deploy smoke test | ⏳ **PENDING** — after Vercel URL live |
| GPS backend | ✅ **ONLINE** |
| Collaboration docs | ✅ **READY** |

### Overall

| Certification | Result |
|---------------|--------|
| **GITHUB COLLABORATION READY** | ✅ Yes |
| **DUBAI TEAM HANDOFF READY** | ✅ Yes |
| **VERCEL DEPLOY READY** | ✅ Yes (pending import) |
| **PRODUCTION PILOT READY** | ⏳ After Vercel smoke test |

---

## Quick Reference

| Item | Value |
|------|--------|
| Repo | https://github.com/fiboso11-sys/kodikz-smart-city-mapping |
| Branch | `release/dubai-giscd-phase1-rc` |
| RC1 tag | `v1.0-giscd-rc1` → `bdb1886` |
| Pilot tag | `v1.0-giscd-pilot` → `71c4838` (unchanged) |
| GPS API | https://api-kodikz.giantphoenixllc.com |
| Health | https://api-kodikz.giantphoenixllc.com/health |

---

*Generated after successful RC1 push. No application code changed. No tags modified.*
