# Release Artifact Strategy — RC1 1.0.0

## Supported model

| Channel | Description |
|---------|-------------|
| Primary | Docker registry delivery of immutable tags |
| Fallback | Offline `docker save` / `docker load` tar under `images/` |

## Required image identity

| Name | Tag | Role |
|------|-----|------|
| `kodikz-smart-city-frontend` | `1.0.0-rc1` | Alias of the Next.js runner image (UI) |
| `kodikz-smart-city-backend` | `1.0.0-rc1` | Next.js runner (UI + Survey API) |
| `kodikz-smart-city-worker` | `1.0.0-rc1` | Background worker |

**Do not use `latest`.**

Architecture note: RC1 is a single Next.js deployable. Frontend and backend tags share one digest; worker is a separate target from the same Dockerfile.

## Identity record (per image)

Recorded in `VERSION`, `images/IMAGE-IDENTITY.txt`, `RELEASE-MANIFEST.json`:

- Image name + version tag
- Digest / image ID (after build)
- Build timestamp
- Source commit (`8612a33f03db738cffc0bfd6bd089abe3f8fd414` for freeze)
- Architecture (`linux/amd64`)
- Runtime user (`kodikz`)
- Exposed port (`3000`)
- Healthcheck path (`/api/health`)

## Build

```bash
./scripts/build-images.sh
```

If Docker is unavailable on the packaging workstation:  
**REQUIRES DOCKER BUILD HOST** — scripts and compose are ready; digests remain placeholders until build.

## Supporting images (pinned)

- `postgres:16-alpine`
- `nginx:1.27-alpine`
- `minio/minio:RELEASE.2024-10-13T13-34-11Z`
