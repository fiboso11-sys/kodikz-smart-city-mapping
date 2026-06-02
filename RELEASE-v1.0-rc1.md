# Kodikz Fleet Platform Pilot Release

| Field | Value |
|-------|--------|
| **Version** | `v1.0-rc1` |
| **Title** | Kodikz Fleet Platform Pilot Release |
| **Status** | Release Candidate |
| **Release date** | 2026-05-26 |
| **Target** | Dubai Municipality pilot — Teltonika FMM130, controlled fleet |

---

## Summary

First **release candidate** for the Kodikz live fleet stack: VPS GPS backend (Teltonika Codec 8 TCP + REST API) and production Next.js frontend (Live Command, fleet KPIs, health, telemetry). Intended for **pilot deployment** after completion of `HANDOFF-CHECKLIST.md` and five-phase acceptance testing.

**Not included in v1.0-rc1:** persistent database, Codec 8 Extended (8E), automated test suite, municipal-scale HA.

---

## Components

| Component | Path | Version |
|-----------|------|---------|
| GPS backend | `backend/` | `1.0.0-rc.1` |
| Production frontend | `frontend/` | `1.0.0-rc.1` |
| Demo app (simulator) | `/` (root) | Unchanged — Vercel demo only |

---

## Features

### Backend

- Teltonika TCP server (port **5000**) — IMEI handshake, Codec **8** AVL, ACK handling
- Multi-device in-memory store — `GET /vehicles`, `GET /vehicle`, `GET /vehicle/:imei`
- Telemetry on API: `ignition`, `batteryVoltage`, `externalPower`, `gsmSignal`, `satellites` (`null` when unavailable)
- `GET /health` — uptime, `dataMode` (`live` | `simulation`), protocol warnings (FMM130 / 8E)
- Optional `API_KEY`, rate limiting, security headers
- `SIMULATION_MODE` for staging without hardware
- PM2 + Nginx + UFW deployment docs

### Frontend

- **Live Command** (`/command`) — fleet panel, KPIs, health panel, vehicle details drawer
- Multi-marker map with 2s polling and smooth marker interpolation
- Teltonika provider — `GET /vehicles`, graceful API errors, offline after **15s** without update
- Ignition indicator in fleet list; full telemetry in drawer

### Documentation

- `backend/DEPLOY.md` — VPS runbook
- `backend/README.md` — API contract
- `backend/docs/FMM130-CONFIGURATION.md` — device commissioning
- `HANDOFF-CHECKLIST.md` — Dubai pre-delivery checklist
- `backend/docs/PRODUCTION-AUDIT.md` — readiness audit

---

## Requirements

| Layer | Requirement |
|-------|-------------|
| VPS | Ubuntu 22.04+, Node 20+, PM2, Nginx, Certbot |
| Device | FMM130 — **Parameter 113 = 0**, Codec **8**, TCP **5000** |
| Frontend host | Vercel — `NEXT_PUBLIC_GPS_PROVIDER=teltonika`, `NEXT_PUBLIC_GPS_API_URL=https://api.<domain>` |
| Registry | Vehicle `imei` must match device IMEI in `frontend/public/data/vehicles.json` |

---

## Known limitations (RC)

1. **Codec 8 only** — factory-default FMM130 (8E) will not produce GPS until reconfigured.
2. **In-memory store** — positions lost on PM2 restart until devices resend.
3. **No automated CI tests** in this tag.
4. **`API_KEY`** breaks browser polling unless unset or injected at proxy.
5. **`connectedDevices`** in `/health` reflects store count, not live TCP session count.

---

## Upgrade from pre-release builds

```bash
cd /opt/kodikz-gps
git fetch --tags
git checkout v1.0-rc1
cd backend
npm ci --omit=dev
pm2 restart kodikz-gps
curl -s http://127.0.0.1:3000/health | jq '{status, dataMode, version}'
```

Redeploy Vercel **frontend** from the same tag after setting env vars.

---

## Acceptance criteria (pilot sign-off)

All five phases must pass before promoting to **v1.0**:

1. `/health` → `status=ok`, `dataMode=live`
2. `[TCP] IMEI registered` in logs
3. `GET /vehicles` contains device IMEI with GPS + telemetry
4. Live Command UI — marker, KPIs, health, drawer
5. Power-off ≥20s → vehicle **Offline** in UI

See pilot procedure in handoff / deployment discussions and `HANDOFF-CHECKLIST.md` §8.

---

## Artifacts

| Artifact | Location |
|----------|----------|
| Handoff checklist | `HANDOFF-CHECKLIST.md` |
| Deploy guide | `backend/DEPLOY.md` |
| API contract | `backend/README.md` |
| FMM130 guide | `backend/docs/FMM130-CONFIGURATION.md` |
| Production audit | `backend/docs/PRODUCTION-AUDIT.md` |

---

## Git tag

```bash
git tag -a v1.0-rc1 -m "Kodikz Fleet Platform Pilot Release (RC)"
git push origin v1.0-rc1
```

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Engineering | | |
| Dubai pilot lead | | |
| Go-live approval | | |

---

*Release candidate — not final production (v1.0) until pilot acceptance complete.*
