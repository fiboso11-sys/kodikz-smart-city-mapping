# Quick Start — Dubai Operator (RC1 1.0.0)

**Audience:** Dubai Infrastructure Team  
**Goal:** Deploy without reading application source.

## 1. Server requirements

Ubuntu **22.04 or 24.04** LTS · **4+ vCPU** · **8+ GB RAM** · **150+ GB** disk · Docker Engine 24+ · Compose v2 plugin.  
See `docs/DUBAI-INFRASTRUCTURE-REQUIREMENTS.md`.

## 2. Package transfer

Copy `handover/RC1-1.0.0/` to the server. Include `images/*.tar` if offline mode.

```bash
cd /opt/kodikz/RC1-1.0.0   # example
chmod +x scripts/*.sh
```

## 3–6. Deploy sequence

```bash
./scripts/preflight.sh
./scripts/configure.sh && ./scripts/validate-config.sh
./scripts/deploy.sh
./scripts/validate.sh
```

## 7. Application URLs

- UI: `FRONTEND_PUBLIC_URL`
- Health: `/health` · `/api/health` · `/api/system-health`
- About: Settings → About / Version
- GPS: external `GPS_BACKEND_URL`

Canonical image: `kodikz-smart-city-app:1.0.0-rc1`

## 8. Status, logs, support

```bash
./scripts/status.sh
./scripts/logs.sh all
./scripts/support.sh
```

## 9. Backup

```bash
./scripts/backup.sh
```

## 10. Emergency rollback

```bash
./scripts/rollback.sh
# or: ./scripts/restore.sh data/backups/backup-<version>-<timestamp>
```

Details: `OPERATOR-SUPPORT-GUIDE.md` · `TROUBLESHOOTING.md`
