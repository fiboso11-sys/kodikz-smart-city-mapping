# GitHub Collaborator Onboarding — gjaya79

**Project:** Dubai Street Mapping Monitoring System (Kodikz Smart City Mapping)  
**Collaborator:** `gjaya79`  
**Prepared for:** First external GitHub collaborator  
**Date:** 2026-06-30  
**Application status:** Frozen for RC1 — documentation/operations only

---

## Executive Summary

The repository is **ready to onboard** GitHub user **`gjaya79`** as the first external collaborator with **Write** access. RC1 application code is frozen at tag `v1.0-giscd-rc1`. All development must use **feature branches** and **Pull Requests** into `release/dubai-giscd-phase1-rc`. The repository owner must invite the collaborator and enable branch protection before direct-push risk is fully eliminated.

---

## Repository Information

| Item | Value |
|------|--------|
| **Repository URL** | https://github.com/fiboso11-sys/kodikz-smart-city-mapping |
| **Release branch** | `release/dubai-giscd-phase1-rc` |
| **RC1 tag** | `v1.0-giscd-rc1` → commit `bdb1886` (frozen app code) |
| **Latest branch commit** | `e96e63d` — documentation only after RC1 |
| **Package manager** | pnpm 10.x |
| **Node.js** | 20 LTS recommended |

### Repository readiness (verified)

| Check | Status |
|-------|--------|
| Release branch on origin | ✅ `e96e63d` |
| Tag `v1.0-giscd-rc1` on origin | ✅ Present |
| GitHub Actions `build.yml` | ✅ Present |
| Latest CI run | ✅ **Success** on `e96e63d` |
| README, INSTALLATION, CONTRIBUTING, etc. | ✅ Present |
| CODEOWNERS | ✅ Present (`@fiboso11-sys`) |
| Issue templates | ✅ bug_report, feature_request |
| PR template | ✅ Present |
| Branch protection | ⏳ **Not enabled** — owner must configure |

---

## Phase 1 — Repository Readiness Summary

The repository meets all requirements for collaborator onboarding:

- Publicly reachable on GitHub
- Release branch synchronized
- CI passing (`pnpm install` → `type-check` → `build`)
- Collaboration templates in `.github/`
- No secrets committed; `.env.example` provided

**Pending owner actions:** Invite `gjaya79`, enable branch protection, optionally add `@gjaya79` to CODEOWNERS.

---

## Phase 2 — Branch Protection Guide (Owner)

**Path:** https://github.com/fiboso11-sys/kodikz-smart-city-mapping/settings/branches  
**Add rule** → Branch name pattern: `release/dubai-giscd-phase1-rc`

| Step | Setting | Enable? | Why |
|------|---------|---------|-----|
| 1 | **Require a pull request before merging** | ✅ | Prevents direct commits to the release branch |
| 2 | **Required approving reviews** → **1** | ✅ | Ensures code review before merge |
| 3 | **Dismiss stale pull request approvals when new commits are pushed** | ✅ | Forces re-review after changes |
| 4 | **Require status checks to pass before merging** | ✅ | CI must pass |
| 5 | **Status check name:** `Type-check and Build` | ✅ | From `.github/workflows/build.yml` |
| 6 | **Require branches to be up to date before merging** | ✅ | Avoids merging outdated branches |
| 7 | **Require conversation resolution before merging** | ✅ | All PR comments must be resolved |
| 8 | **Do not allow bypassing the above settings** | ✅ | Applies rules to admins too |
| 9 | **Allow force pushes** | ❌ Off | Protects release history |
| 10 | **Allow deletions** | ❌ Off | Prevents accidental branch delete |
| 11 | **Restrict who can push to matching branches** | ✅ | Only maintainers may push directly (emergency) |

> **Note:** Status check `Type-check and Build` appears in the dropdown only after CI has run at least once (already passed on `e96e63d`).

---

## Phase 3 — Adding Collaborator `gjaya79` (Owner)

### Step-by-step

1. Open https://github.com/fiboso11-sys/kodikz-smart-city-mapping
2. Click **Settings** (repository settings — requires Admin access)
3. Left sidebar → **Collaborators and teams** (under "Access")
4. Click **Add people**
5. Search: **`gjaya79`**
6. Select the user
7. Choose permission: **Write**
   - Write allows: clone, branch, push feature branches, open PRs, merge PRs (if not blocked by branch protection)
   - Write does **not** allow: change repo settings, add collaborators
8. Click **Add gjaya79 to this repository**
9. GitHub sends an email invitation to `gjaya79`

### Permission: Write (recommended)

| Permission | Use for collaborator |
|------------|---------------------|
| Read | View only — insufficient for development |
| **Write** | ✅ Clone, branch, push, open PRs |
| Maintain | Not needed for developers |
| Admin | Owner only |

### After invitation

**Owner verifies:**
- [ ] Invitation shows as **Pending** in Collaborators list
- [ ] After acceptance, status shows **gjaya79** with **Write** role

**Collaborator verifies:**
- [ ] Email invitation received
- [ ] Accepted at https://github.com/fiboso11-sys/kodikz-smart-city-mapping
- [ ] Repository visible in GitHub dashboard

### Optional: Update CODEOWNERS

Add `@gjaya79` for review routing (owner edits `.github/CODEOWNERS`):

```
* @fiboso11-sys @gjaya79
```

---

## Phase 4 — Developer Setup (gjaya79)

### Prerequisites

- Git 2.x
- Node.js 20+
- pnpm 10+ (`corepack enable` or `npm install -g pnpm`)

### Clone

```bash
git clone https://github.com/fiboso11-sys/kodikz-smart-city-mapping.git
cd kodikz-smart-city-mapping
```

### Checkout release branch

```bash
git checkout release/dubai-giscd-phase1-rc
git pull origin release/dubai-giscd-phase1-rc
```

### Install

```bash
pnpm install
```

### Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` if needed (defaults point to production GPS VPS):

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://api-kodikz.giantphoenixllc.com` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://api-kodikz.giantphoenixllc.com` |
| `NEXT_PUBLIC_GPS_API_URL` | `https://api-kodikz.giantphoenixllc.com` |
| `NEXT_PUBLIC_MAP_PROVIDER` | `maplibre` |

### Run

```bash
pnpm dev
```

Open **http://localhost:3000/dashboard**

### Verify build (before opening PRs)

```bash
pnpm type-check
pnpm build
```

---

## Phase 5 — Git Workflow (Required)

### Never develop on the release branch

```bash
# ❌ WRONG — do not commit directly on release branch
git checkout release/dubai-giscd-phase1-rc
# make changes and push — blocked after branch protection
```

### Always use a topic branch

```bash
git checkout release/dubai-giscd-phase1-rc
git pull origin release/dubai-giscd-phase1-rc
git checkout -b feature/your-feature-name
```

### Branch prefixes

| Prefix | Use |
|--------|-----|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |

**Examples:**
- `feature/live-monitoring-filters`
- `fix/gps-reconnect-banner`
- `docs/update-api-reference`

### Full workflow

```bash
# 1. Start from latest release branch
git checkout release/dubai-giscd-phase1-rc
git pull origin release/dubai-giscd-phase1-rc

# 2. Create branch
git checkout -b feature/live-monitoring

# 3. Make changes, verify locally
pnpm type-check
pnpm build

# 4. Commit
git add .
git commit -m "feat: describe your change"

# 5. Push branch (not release branch)
git push -u origin feature/live-monitoring

# 6. Open Pull Request on GitHub
#    base: release/dubai-giscd-phase1-rc
#    compare: feature/live-monitoring

# 7. Wait for CI + review + approval → Merge

# 8. Delete feature branch after merge
git checkout release/dubai-giscd-phase1-rc
git pull origin release/dubai-giscd-phase1-rc
git branch -d feature/live-monitoring
git push origin --delete feature/live-monitoring
```

---

## Phase 6 — Pull Request Rules

### Commit message examples

```
feat: add export button to vehicle table
fix: handle empty GPS timestamp in dashboard
docs: update INSTALLATION.md for Windows
chore: update pnpm lockfile
```

### Branch naming

- Lowercase, hyphen-separated
- Prefix: `feature/`, `fix/`, or `docs/`
- Descriptive: `feature/permit-csv-export` not `feature/jaya`

### Review checklist (author)

- [ ] `pnpm type-check` passes
- [ ] `pnpm build` passes
- [ ] Tested at http://localhost:3000/dashboard
- [ ] No `.env` or secrets committed
- [ ] PR description explains what and why
- [ ] PR template checklist completed

### CI requirements

Workflow **Build** must pass:

1. `pnpm install --frozen-lockfile`
2. `pnpm type-check`
3. `pnpm build`

### Merge policy

- **Squash merge** recommended (single commit per PR)
- **1 approval** required (after branch protection enabled)
- Do not merge if CI fails
- Do not merge your own PR without another reviewer (when team grows)

### Who approves

- Default: **`@fiboso11-sys`** (CODEOWNERS)
- Future: Dubai team handles added to CODEOWNERS

---

## Phase 7 — Troubleshooting

| Problem | Solution |
|---------|----------|
| **Repository not visible** | Accept GitHub invitation email; check https://github.com/fiboso11-sys/kodikz-smart-city-mapping |
| **Permission denied (push)** | Confirm Write access; use feature branch not release branch; check branch protection |
| **Permission denied (clone)** | Accept invitation; verify SSH key or HTTPS credentials |
| **pnpm install fails** | Use Node 20+; on Windows install build tools for `better-sqlite3`; run `pnpm install` again |
| **Missing env variables** | Copy `.env.example` to `.env.local`; restart `pnpm dev` |
| **Build fails** | Run `pnpm type-check` for errors; ensure on `release/dubai-giscd-phase1-rc` or latest mainline |
| **API connection issues** | Check `NEXT_PUBLIC_API_URL`; test https://api-kodikz.giantphoenixllc.com/health |
| **Socket.IO disconnected** | Check `NEXT_PUBLIC_SOCKET_URL`; verify VPS reachable; check browser console |
| **Map tiles blank** | Internet required for CARTO CDN; check firewall |
| **GPS shows DISCONNECTED** | VPS may be down; master data still loads |

---

## Phase 8 — Verification Checklist (gjaya79)

Complete after invitation accepted:

| # | Task | ☐ |
|---|------|---|
| 1 | Repository visible on GitHub | ☐ |
| 2 | `git clone` successful | ☐ |
| 3 | `git checkout release/dubai-giscd-phase1-rc` successful | ☐ |
| 4 | `pnpm install` successful | ☐ |
| 5 | `.env.local` created from `.env.example` | ☐ |
| 6 | `pnpm type-check` passes | ☐ |
| 7 | `pnpm build` passes | ☐ |
| 8 | `pnpm dev` runs without errors | ☐ |
| 9 | http://localhost:3000/dashboard opens | ☐ |
| 10 | GPS backend reachable (header shows CONNECTED or DISCONNECTED with reason) | ☐ |
| 11 | Created test branch `feature/onboarding-test` | ☐ |
| 12 | Pushed feature branch to origin | ☐ |
| 13 | Opened Pull Request to `release/dubai-giscd-phase1-rc` | ☐ |
| 14 | CI **Build** workflow passes on PR | ☐ |
| 15 | Closed/deleted test PR and branch (optional cleanup) | ☐ |

---

## CI Workflow

**File:** `.github/workflows/build.yml`

**Triggers:** Push and Pull Request to `release/dubai-giscd-phase1-rc` or `master`

**Job name (status check):** `Type-check and Build`

**View runs:** https://github.com/fiboso11-sys/kodikz-smart-city-mapping/actions

---

## Best Practices

1. **Pull before branch** — always `git pull` on release branch before creating a feature branch
2. **Small PRs** — one logical change per PR
3. **Never commit secrets** — `.env.local` is gitignored
4. **Never push to `release/dubai-giscd-phase1-rc` directly**
5. **Never move tags** `v1.0-giscd-rc1` or `v1.0-giscd-pilot`
6. **Deploy from root** — not `frontend/` or `backend/` legacy folders
7. **Run CI locally** before pushing — saves review cycles
8. **Ask in GitHub Issues** if blocked — use bug report template

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution rules |
| [INSTALLATION.md](./INSTALLATION.md) | Full install guide |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Env variable reference |
| [BRANCH-PROTECTION.md](./BRANCH-PROTECTION.md) | Branch protection details |
| [COLLABORATION.md](./COLLABORATION.md) | Team collaboration overview |

---

*Generated for first collaborator onboarding. No application code modified.*
