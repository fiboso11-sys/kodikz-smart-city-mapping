# Container Image Identity Decision — RC1

## Evidence

| Evidence | Finding |
|----------|---------|
| `Dockerfile` | Single `runner` stage serves Next.js (`pnpm start`); `worker` stage reuses runner with `pnpm worker` |
| Compose | One `app` service on `:3000`; nginx proxies UI + API to `app` |
| Source layout | Next.js App Router hosts pages and `/api/*` in one process |

Conclusion: this is a **legitimate single full-stack Next.js deployment**, plus an optional worker container from the same Dockerfile.

## Decision

**Keep one canonical application image. Do not create duplicate frontend/backend images that run identical processes.**

| Role | Image |
|------|-------|
| Full-stack application | `kodikz-smart-city-app:1.0.0-rc1` |
| Worker | `kodikz-smart-city-worker:1.0.0-rc1` |

Deprecated misleading names (removed from package defaults):

- `kodikz-smart-city-frontend:1.0.0-rc1` (was an alias only)
- `kodikz-smart-city-backend:1.0.0-rc1` (renamed to `…-app`)

Separate `web` / `api` image names were **rejected** because they would imply architectural separation that does not exist.

## Image rebuild

**REQUIRES DOCKER BUILD HOST** — digests remain placeholders until `./scripts/build-images.sh` runs.
