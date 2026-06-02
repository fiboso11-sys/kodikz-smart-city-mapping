# Kodikz Fleet Platform — Handoff Checklist

**Document type:** Pre-delivery / go-live handoff  
**Product:** Kodikz Dubai Smart City — Fleet Command (Live GPS)  
**Repository:** `kodikz-smart-city-mapping`  
**Version:** `v1.0-rc1` (package `1.0.0-rc.1`) — see `RELEASE-v1.0-rc1.md`  
**Handoff date:** _______________  
**Prepared by:** _______________  
**Accepted by (Dubai team):** _______________

---

## How to use this document

| Column | Usage |
|--------|--------|
| **Owner** | Role or named person accountable for the item |
| **Status** | `Not Started` · `In Progress` · `Complete` · `Blocked` · `N/A` |
| **Notes** | Evidence (URL, ticket, date), blockers, or exceptions |

**Pilot / go-live rule:** All items in sections **1–8** must be **Complete** (or **N/A** with written justification) before section **9** sign-off.

**Reference runbooks:** `backend/DEPLOY.md` · `backend/README.md` · `backend/docs/FMM130-CONFIGURATION.md` · Pilot procedure (five-phase acceptance)

---

## Sign-off summary

| Section | Items | Complete | Blocked | Owner (lead) |
|---------|-------|----------|---------|----------------|
| 1. Source Code | | | | |
| 2. Backend Deployment | | | | |
| 3. Frontend Deployment | | | | |
| 4. DNS | | | | |
| 5. SSL | | | | |
| 6. Firewall | | | | |
| 7. FMM130 Configuration | | | | |
| 8. Acceptance Testing | | | | |
| **9. Go-Live Approval** | | | | |

---

## 1. Source Code

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | Repository access granted to Dubai team (read or admin per policy) | | | Repo URL: |
| [ ] | Default branch identified and protected (`main` / `master`) | | | Branch: |
| [ ] | Release tag or commit SHA recorded for handoff build | | | Tag/SHA: |
| [ ] | `backend/package.json` version aligned with deployment manifest | | | Version: |
| [ ] | `frontend/package.json` version aligned with Vercel deployment | | | Version: |
| [ ] | No secrets committed (`.env`, keys, tokens); `.env.example` present | | | |
| [ ] | `backend/.env.example` reviewed against production `.env` on VPS | | | |
| [ ] | `frontend/.env.example` reviewed against Vercel env vars | | | |
| [ ] | Handoff includes paths: `/backend`, `/frontend`, root demo app scope documented | | | |
| [ ] | Third-party licenses / dependency audit acknowledged (Node, Next.js, MapLibre) | | | |

---

## 2. Backend Deployment

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | Ubuntu 22.04 LTS VPS provisioned (specs documented) | | | IP: · Provider: |
| [ ] | Node.js **20+** installed (`node -v`) | | | |
| [ ] | PM2 installed globally; `pm2 startup` configured | | | |
| [ ] | Application deployed to `/opt/kodikz-gps` (or agreed path) | | | Path: |
| [ ] | `npm ci --omit=dev` run in `backend/` | | | |
| [ ] | Production `.env` created (`chmod 600`); not in git | | | |
| [ ] | `NODE_ENV=production` | | | |
| [ ] | `SIMULATION_MODE=false` for live pilot/production | | | |
| [ ] | `HOST=0.0.0.0` · `TCP_PORT=5000` | | | |
| [ ] | `API_HOST=127.0.0.1` · `API_PORT=3000` (not public) | | | |
| [ ] | `CORS_ORIGIN` set to exact Vercel URL(s) (no `*` in production) | | | URL(s): |
| [ ] | `TRUST_PROXY=true` when behind Nginx | | | |
| [ ] | `API_KEY` unset for browser polling **or** Nginx injects key (document choice) | | | |
| [ ] | PM2 app `kodikz-gps` running: `pm2 status` | | | |
| [ ] | PM2 logs path configured (`backend/logs/`) | | | |
| [ ] | Nginx site enabled from `backend/deploy/nginx.conf.example` | | | Site name: |
| [ ] | `curl http://127.0.0.1:3000/health` returns `"status":"ok"` | | | |
| [ ] | Public `GET https://api.<domain>/health` returns `"status":"ok"` | | | |
| [ ] | `dataMode` = `"live"` on health response | | | |
| [ ] | Upgrade procedure documented (`git pull` · `npm ci` · `pm2 restart`) | | | See `backend/DEPLOY.md` §10 |

---

## 3. Frontend Deployment

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | Vercel project created for **`frontend/`** directory (not root demo unless intended) | | | Project: |
| [ ] | Production domain assigned (custom or `*.vercel.app`) | | | URL: |
| [ ] | `NEXT_PUBLIC_GPS_API_URL` = `https://api.<domain>` (HTTPS, no trailing slash) | | | |
| [ ] | `NEXT_PUBLIC_GPS_PROVIDER` = `teltonika` | | | |
| [ ] | Production deployment succeeded (`pnpm build` clean on Vercel) | | | Build ID: |
| [ ] | Mapbox / map tile token configured if required by environment | | | |
| [ ] | Vehicle registry: pilot IMEI(s) set in `public/data/vehicles.json` or agreed data source | | | IMEI(s): |
| [ ] | Live Command route verified: `/command` | | | |
| [ ] | Browser smoke test: no CORS errors in DevTools console | | | |
| [ ] | GPS poll interval ~2s (`GET /vehicles`) confirmed in network tab | | | |

---

## 4. DNS

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | API hostname defined (e.g. `api.<municipality-domain>`) | | | FQDN: |
| [ ] | DNS `A` (or `AAAA`) record points API host to VPS public IP | | | TTL: |
| [ ] | Frontend hostname defined (Vercel custom domain or default) | | | FQDN: |
| [ ] | Frontend DNS / Vercel domain verification complete | | | |
| [ ] | DNS propagation verified (`dig` / `nslookup` from external network) | | | |
| [ ] | Teltonika devices use **VPS public IP** or hostname that resolves to it | | | IP/hostname given to field team: |

---

## 5. SSL

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | Let's Encrypt / Certbot installed on VPS | | | |
| [ ] | Certificate issued for API hostname (`certbot --nginx`) | | | Expiry: |
| [ ] | HTTP → HTTPS redirect active (port 80) | | | |
| [ ] | TLS 1.2+ verified on API endpoint | | | |
| [ ] | Certificate auto-renewal tested (`certbot renew --dry-run`) | | | |
| [ ] | Vercel frontend served over HTTPS | | | |
| [ ] | No mixed-content errors (API called via `https://`) | | | |
| [ ] | Device TCP port **5000** remains **plain TCP** (Teltonika standard; not TLS) | | | Documented for security review |

---

## 6. Firewall

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | UFW enabled (`sudo ufw status`) | | | |
| [ ] | SSH allowed (key-only login enforced) | | | Port: |
| [ ] | `80/tcp` and `443/tcp` allowed (Nginx) | | | |
| [ ] | `5000/tcp` allowed for Teltonika devices | | | Restrict to device IP ranges if policy requires: |
| [ ] | **`3000/tcp` NOT exposed** to internet (`API_HOST=127.0.0.1`) | | | |
| [ ] | Cloud provider security group aligned with UFW rules | | | Provider: |
| [ ] | Monitoring / health probes can reach `https://api.<domain>/health` | | | |

---

## 7. FMM130 Configuration

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | Teltonika Configurator access available to field team | | | |
| [ ] | **Parameter 113 = 0** (Codec 8) — not Codec 8 Extended | | | |
| [ ] | Data protocol: **Codec 8** only (not 8E, not JSON) | | | |
| [ ] | Server IP = VPS public IP (or valid hostname) | | | |
| [ ] | TCP port **5000**, protocol **TCP**, TLS **off** | | | |
| [ ] | Configuration saved and device rebooted | | | |
| [ ] | Backend log: `[TCP] IMEI registered: <imei>` | | | IMEI: |
| [ ] | First AVL codec ID verified **`0x08`** (not `0x8E`) | | | Method: log / capture |
| [ ] | `GET /vehicle?imei=<imei>` returns 200 with coordinates | | | |
| [ ] | Telemetry fields present on API (`ignition`, `batteryVoltage`, etc.; null allowed) | | | |
| [ ] | FMM130 guide distributed: `backend/docs/FMM130-CONFIGURATION.md` | | | |
| [ ] | Device inventory sheet: IMEI ↔ vehicle plate ↔ registry ID | | | Attached: Y/N |

---

## 8. Acceptance Testing

Complete all five pilot phases; mark each sub-item when evidence is attached.

### Phase 1 — Backend health

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | `GET /health` → `status` = `ok` | | | |
| [ ] | `dataMode` = `live` | | | |
| [ ] | `checks.tcp` = `up` · `checks.http` = `up` | | | |

### Phase 2 — Device connect

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | PM2 log shows `[TCP] IMEI registered` | | | Date/time: |

### Phase 3 — GPS & API

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | AVL records logged with lat/lon/speed | | | |
| [ ] | `GET /vehicles` contains pilot IMEI | | | |
| [ ] | `GET /vehicle?imei=` returns valid fix | | | |
| [ ] | Telemetry verified on API response | | | |

### Phase 4 — Frontend (Live Command)

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | Vehicle marker visible on map | | | |
| [ ] | Fleet KPIs update (incl. Reporting &lt; 15s) | | | |
| [ ] | Fleet Health panel: API/TCP up, last packet recent | | | |
| [ ] | Vehicle Details drawer shows GPS + telemetry | | | |

### Phase 5 — Offline behaviour

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | Device powered off ≥ 20 seconds | | | |
| [ ] | Fleet UI shows **Offline** for vehicle | | | |
| [ ] | Reporting KPI decreases accordingly | | | |

### Operational acceptance (recommended)

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | `deploy/scripts/healthcheck.sh` exits 0 against public `/health` | | | |
| [ ] | Uptime monitor configured on `/health` | | | Tool: |
| [ ] | PM2 restart test: process recovers; documented data loss (in-memory store) | | | |
| [ ] | On-call / escalation contacts documented | | | |

---

## 9. Go-Live Approval

| [ ] | Item | Owner | Status | Notes |
|:---:|------|-------|--------|-------|
| [ ] | Sections **1–8** complete or N/A with signed exceptions | | | Exception log: |
| [ ] | Known limitations acknowledged (Codec 8 only, in-memory store, no 8E) | | | See `backend/docs/PRODUCTION-AUDIT.md` |
| [ ] | Production URLs communicated to stakeholders | | | API: · App: |
| [ ] | Rollback plan agreed (PM2 restart, Vercel promote previous, device server IP revert) | | | |
| [ ] | Support window for hypercare defined (dates / hours) | | | |
| [ ] | **Technical lead sign-off** | | | Name: · Date: |
| [ ] | **Dubai municipality / product owner sign-off** | | | Name: · Date: |
| [ ] | **Go-live authorized** | | | Date/time (UTC): |

---

## Exception register

Use when any checklist item is **Blocked** or waived.

| ID | Section | Item | Reason | Risk | Approved by | Date |
|----|---------|------|--------|------|-------------|------|
| EX-01 | | | | | | |
| EX-02 | | | | | | |

---

## Appendix — Quick reference

| Component | Value |
|-----------|--------|
| Teltonika TCP | `VPS_IP:5000` (Codec 8) |
| HTTP API (internal) | `http://127.0.0.1:3000` |
| HTTP API (public) | `https://api.<domain>` |
| Health | `GET /health` |
| Fleet data | `GET /vehicles` |
| Frontend env | `NEXT_PUBLIC_GPS_API_URL`, `NEXT_PUBLIC_GPS_PROVIDER=teltonika` |
| Offline threshold (UI) | 15 seconds without GPS update |
| Poll interval (UI) | 2 seconds |

---

*End of handoff checklist*
