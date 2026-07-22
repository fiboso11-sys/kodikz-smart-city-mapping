# Legacy Folder Audit — Phase 6.2

**Date:** 2026-07-23  
**Release:** Version 1.0.0 RC1  
**Subjects:** `frontend/` · `backend/`

## Evidence collected

| Source | Finding |
|--------|---------|
| `pnpm-workspace.yaml` | **Absent** — not a monorepo workspace |
| `turbo.json` | **Absent** |
| Root `package.json` | Scripts run root Next app only (`pnpm build` → `next build`). No `workspaces` field. No scripts `cd frontend` / `cd backend`. |
| `frontend/package.json` | Separate app name `kodikz-dubai-mapping` — historical prototype |
| `backend/package.json` | Separate app name `kodikz-gps-backend` — GPS IoT stack copy |
| `tsconfig.json` | **Explicitly excludes** `"frontend"` and `"backend"` |
| Root `Dockerfile` | Builds root app; runner copies `public`, `.next`, `scripts`, `src` only — **no** `frontend/` or `backend/` COPY into runtime image |
| `docker-compose*.yml` (root) | `build.context: .` / `target: runner` for survey app — **no** services named frontend/backend from those folders |
| `.github/workflows/build.yml` | `pnpm type-check` + `pnpm build` at repo root only — **no** frontend/backend steps |
| `vercel.json` | Root `pnpm run build` — framework nextjs |
| `.dockerignore` | Does not specially require frontend/backend |
| `handover/RC1-1.0.0/scripts/*` | **No** `frontend/` or `backend/` path references |
| `src/**` imports | **No** imports of `frontend/` or `backend/` modules |
| `scripts/` (root tooling) | **No** cd/path into frontend/backend |
| Tracked file counts | `frontend/` 71 · `backend/` 27 · `src/` 201 |
| README / CONTRIBUTING / ARCHITECTURE | Already label both as **legacy / do not deploy** |

## Are they actively used?

| Question | Answer | Evidence |
|----------|--------|----------|
| Required for RC1 production build? | **No** | Root `pnpm build`; CI; Dockerfile runner |
| Required for type-check/lint? | **No** | Excluded from tsconfig; root tsc |
| Required for tests (UAT/RBAC/SGE)? | **No** | Root `tsx` scripts under `src/` |
| Required for plug-and-play deploy? | **No** | Handover package uses root image + compose |
| Required for GPS at runtime? | **No** | App uses external `NEXT_PUBLIC_API_URL` / Socket.IO to VPS |
| Historical copies? | **Yes** | Separate package names; docs call them archived |

## Search hits that are NOT runtime dependencies

- Documentation warnings (“do not deploy from frontend/”)
- Historical audit reports mentioning the folders
- Image-naming prose (“frontend/backend Docker tags”) — unrelated to these directories
- `backend/` string in API JSON field `"backend": "sqlite|memory"` — unrelated
