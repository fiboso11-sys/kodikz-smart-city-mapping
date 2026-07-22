# Pre-Deletion Safety Review — Phase 6.2A

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Release:** Version **1.0.0 RC1**  
**Date:** 2026-07-23  
**Mode:** **READ-ONLY** — no deletion, commit, push, or deploy performed

---

## Evidence Summary

| Item | Status |
|------|--------|
| Folders still present on disk | YES — `frontend/` · `backend/` |
| Tracked files | `frontend/` **71** · `backend/` **27** |
| Prior audit `LEGACY-FOLDER-AUDIT.md` | Present; agrees unused |
| Prior classification `LEGACY-CLASSIFICATION.md` | Present; **OPTION A** |
| Audit consistency | **PASS** — both conclude unused / safe to remove |
| Destructive ops this phase | **NONE** |

Separate package identities (not the RC1 root app):

- `frontend/package.json` → `kodikz-dubai-mapping`
- `backend/package.json` → `kodikz-gps-backend`

---

## Dependency Review (re-run)

| Check | Result |
|-------|--------|
| `pnpm-workspace.yaml` | Absent |
| `turbo.json` | Absent |
| Root `package.json` workspaces | `null` |
| Root scripts reference `cd frontend` / `cd backend` | **None** |
| `tsconfig.json` | **Excludes** `"frontend"`, `"backend"` |
| Root `Dockerfile` runner copies | `public`, `.next`, `node_modules`, `package.json`, `scripts`, `src`, `tsconfig` only — **not** frontend/backend |
| Root `Dockerfile` builder `COPY . .` | Includes folders in **build context only**; they are not consumed by `pnpm build` or runner stage |
| `docker-compose*.yml` path refs to `frontend/` / `backend/` | **None** found |
| `.github/workflows/*` | Root `pnpm type-check` / `pnpm build` only |
| `vercel.json` | Root `pnpm run build` |
| `render.yaml` | Absent |
| `src/` imports of frontend/backend modules | **None** |
| Root `scripts/` path/cd into folders | **None** (one historical doc string in `write-phase53-handover-docs-c.js` mentioning “frontend/backend release notes” — prose, not a path dependency) |
| Handover operator scripts | No path dependency; comment text only about Docker image naming |
| Pattern search `cd frontend` / `./frontend` / `frontend\` in code/config | **No matches** in `*.{yml,yaml,json,ts,tsx,js,mjs,cjs,sh,ps1}` |

### Hits that are NOT verified dependencies

- Markdown warnings: “do not deploy from `frontend/`”
- Historical audit reports
- Prose about “frontend/backend” Docker **image tags** (unrelated directories)
- JSON field name `"backend"` (sqlite/memory) in API docs

**Verified runtime/build/CI/deploy dependency:** **NONE**

---

## Build Impact Review

| Area | Impact if removed |
|------|-------------------|
| Type-check | None expected (already excluded) |
| Lint | None expected |
| Production build | None expected (root Next.js) |
| Runtime | None — GPS via external VPS URLs |
| Deployment / plug-and-play | None — handover uses root image |
| CI/CD / Vercel | None — root commands |
| Operator / support / handover docs | Must be **updated after** deletion approval (warnings currently reference the folders) |
| Release package content under `handover/` | Unaffected (no copies of those trees required) |

---

## Risk Assessment

### **LOW**

**Why:**

1. Tooling explicitly excludes both trees from TypeScript.  
2. Production image runner never copies them.  
3. CI and Vercel build the root app only.  
4. GPS production path is the external VPS, not `backend/` in this repo.  
5. Docs already instruct Dubai **not** to deploy these folders.

**Residual risks (non-blocking):**

- Historical markdown will still mention the folders until a post-deletion doc pass.  
- `backend/` contains a **reference copy** of GPS server docs useful for archaeology — not required for RC1 pilot if VPS is already running.  
- Rollback branch recommended before any `git rm`.

---

## Recommended Commands (DO NOT EXECUTE IN THIS PHASE)

### Step 1 — Rollback branch

```bash
git branch backup/pre-legacy-cleanup
```

### Step 2 — Removal (only after Release Manager approval)

```bash
git rm -r frontend backend
```

### Step 3 — Quality gates

```bash
git status
pnpm type-check
pnpm lint
pnpm build
```

### Step 4 — Documentation follow-up (after successful gates)

Update operator-facing docs (README, ARCHITECTURE, CONTRIBUTING, Dubai handoff guides) to state legacy folders were **removed**, production app is `src/`, GPS remains Dubai VPS.

### Step 5 — Commit (separate approval)

Commit cleanup + doc updates. **Do not push** until Release Manager authorizes network operations.

---

## Rollback Plan

If deletion causes unexpected failure:

```bash
git checkout backup/pre-legacy-cleanup
# or restore paths from that branch:
git checkout backup/pre-legacy-cleanup -- frontend backend
```

---

## Quality Gates (planned post-deletion)

| Gate | Required |
|------|----------|
| `git status` (sensible staged deletion) | Yes |
| `pnpm type-check` | PASS |
| `pnpm lint` | PASS |
| `pnpm build` | PASS |
| Secret scan / no accidental env commit | Yes |
| Operator docs no longer instruct use of deleted paths | Yes |

**Not run in Phase 6.2A** (read-only).

---

## Human Approval Required

| Action | Status |
|--------|--------|
| Delete `frontend/` / `backend/` | **BLOCKED** until Release Manager approval |
| `git rm` / commit / push | **NOT EXECUTED** |
| Invite collaborators / deploy | **NOT IN SCOPE** |

---

## Recommendation

### OPTION 1 — SAFE TO REMOVE

Evidence confirms the folders are unused by RC1 build, CI, runtime, and deployment.  

**Await explicit Release Manager approval before any deletion.**

---

*End of Phase 6.2A — STOP. No files deleted.*
