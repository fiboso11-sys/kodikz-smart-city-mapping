# Application container notes (RC1 1.0.0)

RC1 is a **single full-stack Next.js** deployable that serves:

- Survey Guidance UI
- Survey REST/SSE APIs

Evidence: one Dockerfile `runner` target, one Compose `app` service on port 3000, worker as separate target.

## Canonical image identity (immutable — never use `latest`)

| Role | Image tag |
|------|-----------|
| Full-stack application | `kodikz-smart-city-app:1.0.0-rc1` |
| Background worker | `kodikz-smart-city-worker:1.0.0-rc1` |

Do **not** invent separate frontend/backend images that run the same process.

Build on a Docker-capable host:

```bash
./scripts/build-images.sh
```

Until built: digests are **REQUIRES DOCKER BUILD HOST**.

## Runtime

- User: `kodikz` (non-root)
- Port: `3000` (internal; nginx publishes 80/443)
- Health: `/api/health`
- Readiness: `/api/readiness`
- System health: `/api/system-health`
- Release identity: `/api/release-identity`
