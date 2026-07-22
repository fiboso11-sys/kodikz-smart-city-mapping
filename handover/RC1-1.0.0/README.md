# RC1 1.0.0 — Plug-and-Play Deployment Package

**Tag:** `v1.0.0-rc1`  
**Commit:** `8612a33f03db738cffc0bfd6bd089abe3f8fd414`  
**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  

Dubai owns the server, OS, firewall, DNS, TLS, and infrastructure monitoring.  
This package is the **application deployment kit** — no source-code exploration required.

## Operator workflow

```bash
chmod +x scripts/*.sh
./scripts/preflight.sh
./scripts/configure.sh
./scripts/deploy.sh
./scripts/validate.sh
```

Ops: `status.sh` · `logs.sh` · `backup.sh` · `restore.sh` · `update.sh` · `rollback.sh` · `uninstall.sh`

Start here: **[QUICK-START.md](./QUICK-START.md)**

## Package layout

| Path | Purpose |
|------|---------|
| `images/` | Offline docker-save bundle + digest records |
| `app/` | Application image identity notes |
| `database/` | Migration / reference vs demo notes |
| `deploy/` | `docker-compose.plugplay.yml` + nginx |
| `config/` | Guided config templates (no real secrets) |
| `scripts/` | Operator commands |
| `docs/` | Infrastructure + runbook copies |
| `logs/` | Operator audit logs (runtime) |
| `reports/` | Preflight / deploy / validation reports (runtime) |
| `documentation/` | Full Phase 5.3+ handover document set |
| `deployment/` | Original Dockerfile/compose templates |
| `environment/` | Env examples |
| `VERSION` | Release identity |
| `CHECKSUMS.sha256` | Package integrity |
| `RELEASE-MANIFEST.json` | Machine-readable identity |
| `RELEASE-NOTES.md` | What shipped |
| `RELEASE-ARTIFACT-STRATEGY.md` | Image delivery model |

## Images

Immutable tags only:

- `kodikz-smart-city-app:1.0.0-rc1`
- `kodikz-smart-city-worker:1.0.0-rc1`

Build/export: `./scripts/build-images.sh` on a **Docker build host**.  
Until then digests are marked **REQUIRES DOCKER BUILD HOST**.

## Security

- No real secrets in this package  
- Demo data is **not** loaded by deploy/migrate  
- See `PLUG-AND-PLAY-SECURITY-AUDIT.md`

## Acceptance

`DUBAI-PLUG-AND-PLAY-ACCEPTANCE-CHECKLIST.md`

## Phase readiness

See repository root: `PHASE56-PLUG-AND-PLAY-DEPLOYMENT-READINESS.md`
