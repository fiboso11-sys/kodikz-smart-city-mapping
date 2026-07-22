# Release Artifact Strategy — RC1 1.0.0

## Supported model

| Channel | Description |
|---------|-------------|
| Primary | Docker registry delivery of immutable tags |
| Fallback | Offline `docker save` / `docker load` tar under `images/` |

## Required image identity

| Name | Tag | Role |
|------|-----|------|
| `kodikz-smart-city-app` | `1.0.0-rc1` | Full-stack Next.js (UI + Survey API) |
| `kodikz-smart-city-worker` | `1.0.0-rc1` | Background worker |

**Do not use `latest`.**  
Do not ship duplicate frontend/backend images for the same process — see `CONTAINER-IMAGE-IDENTITY-DECISION.md`.

## Identity record

`src/lib/release-identity.ts`, `RELEASE-IDENTITY.json`, `handover/RC1-1.0.0/VERSION`, `RELEASE-MANIFEST.json`

## Build

```bash
./scripts/build-images.sh
```

**REQUIRES DOCKER BUILD HOST** when Docker is unavailable on the packaging workstation.

## Supporting images (pinned)

- `postgres:16-alpine`
- `nginx:1.27-alpine`
- `minio/minio:RELEASE.2024-10-13T13-34-11Z`
