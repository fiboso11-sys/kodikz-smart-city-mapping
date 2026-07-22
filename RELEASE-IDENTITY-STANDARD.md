# Release Identity Standard — RC1

## Authoritative sources (keep aligned)

| Consumer | Source |
|----------|--------|
| Application UI / APIs | `src/lib/release-identity.ts` |
| Machine-readable mirror | `RELEASE-IDENTITY.json` (repo root) |
| Operator scripts / package | `handover/RC1-1.0.0/VERSION` |

Do not invent divergent version strings in docs or Compose without updating these three.

## Required identity

| Field | Value |
|-------|-------|
| Product | Kodikz Smart City Mapping & Survey Guidance Platform |
| Application version | `1.0.0` |
| Release channel | `RC1` |
| Git tag | `v1.0.0-rc1` |
| Git commit | `8612a33f03db738cffc0bfd6bd089abe3f8fd414` (freeze) |
| Database migration | `1` |
| Canonical image | `kodikz-smart-city-app:1.0.0-rc1` |
| Worker image | `kodikz-smart-city-worker:1.0.0-rc1` |

## Runtime / build overrides

| Variable | Purpose |
|----------|---------|
| `KODIKZ_GIT_COMMIT` / `NEXT_PUBLIC_KODIKZ_GIT_COMMIT` | Commit SHA |
| `KODIKZ_BUILD_TIME` / `NEXT_PUBLIC_KODIKZ_BUILD_TIME` | Build timestamp |
| `KODIKZ_IMAGE_DIGEST` | Image digest when known |
| `KODIKZ_DEPLOYMENT_ID` | Deployment identifier |
| `DEPLOYMENT_MODE` | Runtime environment |
| `KODIKZ_MIGRATION_VERSION` | Override migration label |

Until Docker build host fills digests/timestamps: values remain `REQUIRES_DOCKER_BUILD_HOST`.

## Endpoints

- `GET /api/release-identity` — safe public identity JSON
- `GET /api/system-health` — identity + component health
