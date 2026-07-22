# Legacy Classification — Phase 6.2

## Decision

### OPTION A — Legacy directories are unused. Safe to remove.

## Dependency analysis (verified)

| Concern | Depends on `frontend/` or `backend/`? | Evidence |
|---------|--------------------------------------|----------|
| Production build | No | Root Next.js |
| Type-check / lint | No | tsconfig exclude |
| Tests | No | `src/` test runners |
| Deployment / Docker / CI / Vercel | No | Root Dockerfile, compose, Actions, vercel.json |
| Runtime / env / DB / GPS / Socket.IO | No | External GPS URL; Postgres/MinIO via root compose |

**No verified build, CI, deploy, or runtime dependency found.**  
Therefore Part 2 STOP condition does **not** apply.

## Why not B or C

| Option | Rejected because |
|--------|------------------|
| B — still required | No tooling path requires them |
| C — partial migration | References are documentation warnings only, not code coupling |

## Action authorized by Option A

Remove `frontend/` and `backend/` from the Git tree and update operator-facing documentation so Dubai cannot confuse them with the RC1 deploy path.
