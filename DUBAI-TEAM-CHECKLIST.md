# Dubai Team Checklist — GISCD Phase 1 Pilot

**Release:** `v1.0-giscd-pilot` · Branch `release/dubai-giscd-phase1-rc`

---

## Pre-Deployment

- [ ] Clone release branch from configured git remote
- [ ] Checkout tag `v1.0-giscd-pilot`
- [ ] Node.js 20+ and pnpm installed on server
- [ ] Copy `.env.example` → `.env.local`
- [ ] Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL`
- [ ] `pnpm install` completes (verify `better-sqlite3` builds)
- [ ] `pnpm run build` succeeds
- [ ] Writable `data/` directory for SQLite

---

## Server Deployment

- [ ] Application deployed from repo root (`src/`, not `frontend/`)
- [ ] Process manager configured (PM2 / systemd)
- [ ] `pnpm start` or `next start` on port 3000
- [ ] Reverse proxy (nginx/Caddy) routes HTTPS → app
- [ ] Firewall: port 443 public; port 3000 internal only

---

## SSL

- [ ] TLS certificate installed (Let's Encrypt or municipality CA)
- [ ] HTTPS enforced on public URL
- [ ] Socket.IO connects over WSS (same origin as portal)
- [ ] No mixed-content warnings in browser

---

## Backend Health

- [ ] `GET https://api-kodikz.giantphoenixllc.com/health` → `status: ok`
- [ ] Portal `/api/system-health` → `overall: ONLINE`
- [ ] MongoDB running on GPS backend VPS
- [ ] GPS backend PM2/systemd active

---

## Socket.IO

- [ ] Portal header shows `GPS CONNECTED` when backend reachable
- [ ] `location_update` events received (test with 1 device)
- [ ] Map marker moves without page refresh
- [ ] Reconnect works after network interruption

---

## Tracker Configuration (Teltonika FMM130)

- [ ] Codec 8 enabled (Parameter 113 = 0) — **not** Codec 8 Extended
- [ ] Server host: `api-kodikz.giantphoenixllc.com` (or VPS IP)
- [ ] TCP port: **5000**
- [ ] Protocol: TCP
- [ ] APN configured on SIM
- [ ] Outdoor GPS fix confirmed

---

## IMEI Registration

- [ ] IMEI recorded from device label
- [ ] Vehicle created in `/vehicles` with matching IMEI
- [ ] Plate number, company, permit number entered
- [ ] `GET /api/vehicles/live` shows device when reporting

---

## Vehicle Master

- [ ] All pilot IMEIs registered before rollout
- [ ] Bulk import tested (if >20 devices)
- [ ] Vehicle status shows Moving / Idle / Offline correctly

---

## Permit Master

- [ ] Active permits entered for each mapping company
- [ ] Vehicles assigned to permits (multi-select)
- [ ] Permit dates and status correct

---

## Geo Upload

- [ ] Route GeoJSON (LineString) uploaded for test permit
- [ ] Area GeoJSON (Polygon) uploaded for test permit
- [ ] Layers visible on dashboard map
- [ ] Invalid file rejected with clear error message

---

## Map Validation

- [ ] MapLibre loads OpenStreetMap basemap
- [ ] Street and Humanitarian basemaps switch correctly
- [ ] Vehicle clustering works at Dubai zoom levels
- [ ] Fleet sidebar search (IMEI, plate, company) works
- [ ] No Mapbox token required

---

## Tracker Rollout Plan

| Phase | Devices | Validation |
|-------|---------|------------|
| **1** | 1 tracker | IMEI registration, live marker, socket update |
| **2** | 5 trackers | Dashboard KPIs, fleet sidebar, status engine |
| **3** | 20 trackers | Map performance, API latency <2s |
| **4** | 50 trackers | Server load, GPS backend capacity |
| **5** | 100 trackers | Full pilot sign-off |

### Per-phase checks

- [ ] All devices show on map within 30s of first packet
- [ ] Offline devices correctly marked after 10 min no update
- [ ] Moving/idle thresholds correct (>5 km/h = moving)
- [ ] No data loss after portal restart (SQLite persistence)

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| GISCD Technical Lead | | | |
| Server Team | | | |
| Hardware Team | | | |
| Pilot Coordinator | | | |
