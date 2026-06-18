# Dubai Street Mapping Monitoring System — Handoff Guide

**Product:** Dubai Municipality GISCD Phase 1 Web GIS Portal  
**Version:** 1.0.0 (Phase 1 pilot)  
**Target backend:** `https://api-kodikz.giantphoenixllc.com`

---

## 1. System Overview

The Dubai Street Mapping Monitoring System is a Next.js 15 web application for real-time fleet oversight, permit management, and GeoJSON route/area layers. It integrates with the Kodikz GPS backend (Teltonika FMM130, Codec 8) via REST and Socket.IO.

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Map | MapLibre GL JS + OpenStreetMap (Street / Humanitarian) |
| State | Zustand + TanStack Query |
| Persistence | SQLite (`data/giscd.db`) — PostGIS-ready repository pattern |
| Live GPS | Socket.IO `location_update` + REST polling |

**Deploy from repository root** (`kodikz-smart-city-mapping/`), not `frontend/` or `backend/`.

---

## 2. Frontend Deployment

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local with production API URLs

pnpm run build
pnpm start
# Default port 3000
```

**Production (Vercel / VPS):**

- Set environment variables (see §4).
- Ensure `data/` directory is writable for SQLite persistence, or mount a volume.
- No Mapbox token required.
- **Demo seed data** (5 vehicles, 4 permits) loads only when `NODE_ENV=development`. Production starts with an empty SQLite database.

---

## 3. Backend Deployment

GPS backend lives in `backend/` (separate repo: `kodikz-gps-backend`).

| Service | Port | Purpose |
|---------|------|---------|
| HTTP API | 3001 (or configured) | REST + Socket.IO |
| Teltonika TCP | **5000** | Device ingress (Codec 8) |

See `backend/README.md` for MongoDB, PM2, and firewall setup.

**Health check:** `GET https://api-kodikz.giantphoenixllc.com/health`

---

## 4. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | GPS REST API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Socket.IO server (usually same as API) |
| `NEXT_PUBLIC_GPS_API_URL` | Legacy alias | Falls back if `NEXT_PUBLIC_API_URL` unset |
| `NEXT_PUBLIC_MAP_PROVIDER` | No | `maplibre` (default) |
| `SQLITE_PATH` | No | Custom DB path (default: `data/giscd.db`) |
| `DATABASE_URL` | Phase 2 | PostgreSQL connection string |

Example `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_SOCKET_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_MAP_PROVIDER=maplibre
```

---

## 5. API Endpoints

### External GPS Backend

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health |
| GET | `/vehicles` or `/vehicles/live` | Live fleet snapshot |
| GET | `/vehicle/:imei` | Single device |
| GET | `/history/:imei?limit=50` | Position history |

### Next.js Internal API

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/vehicles` | Vehicle master CRUD |
| GET | `/api/vehicles/live` | Merged master + GPS live |
| GET/POST | `/api/permits` | Permit CRUD |
| POST | `/api/permits/:id/upload-route` | Route GeoJSON |
| POST | `/api/permits/:id/upload-area` | Area GeoJSON |
| GET | `/api/geo-uploads` | All uploaded layers |
| GET | `/api/system-health` | Module status dashboard |
| GET | `/api/gps/health` | Proxied GPS health |

---

## 6. Socket.IO Events

**Connect to:** `NEXT_PUBLIC_SOCKET_URL`  
**Path:** `/socket.io`  
**Transports:** `websocket`, `polling`

| Event | Direction | Payload |
|-------|-----------|---------|
| `location_update` | Server → Client | `{ imei, latitude, longitude, speed, heading, timestamp, ... }` |

The frontend updates map markers, speed, and status in real time without page refresh. Connection states: `CONNECTED`, `DISCONNECTED`, `RECONNECTING`.

---

## 7. Vehicle Onboarding Process

1. **Register permit** in Permits module (or import via API).
2. **Add vehicle** in Vehicles module with:
   - IMEI (15 digits, matches tracker)
   - Plate, company, driver details
   - Linked permit number
3. **Assign vehicle to permit** via Permits → Edit → Assigned Vehicles multi-select.
4. **Configure Teltonika FMM130** (see §8).
5. **Verify** on Dashboard / Live Monitoring — marker appears when device reports.

---

## 8. IMEI Registration Process

1. Obtain IMEI from device label or SMS config.
2. Create vehicle record: `POST /api/vehicles` with `imei` field.
3. GPS backend auto-registers devices on first TCP connection — IMEI in master registry must match.
4. Confirm live data: `GET /vehicle/{imei}` on GPS API.

---

## 9. Connecting 50–100 Trackers

1. **Backend capacity:** Ensure VPS has sufficient RAM/CPU; MongoDB indexed on `imei`.
2. **TCP port 5000** open on firewall for all device SIM IPs.
3. **Codec 8:** FMM130 must use Codec 8 (not 8E) — see `backend/docs/TELTONIKA-COMPATIBILITY.md`.
4. **Bulk import:** Use Vehicles API or SQLite seed script for batch IMEI registration.
5. **Monitor:** System Health page + GPS connection indicator in header.
6. **Polling fallback:** REST polls every 5s if Socket disconnects.

**Recommended batch:** Register 10 devices → verify → scale to 50 → 100.

---

## 10. Troubleshooting Guide

| Symptom | Cause | Fix |
|---------|-------|-----|
| GPS banner "backend unavailable" | Wrong API URL or backend down | Check `NEXT_PUBLIC_API_URL`, hit `/health` |
| HTML parse error on GPS | URL points to Next.js app | Set API URL to VPS backend |
| Devices offline on map | Codec 8E / wrong server IP | Reconfigure FMM130 to Codec 8 + correct host |
| Data lost on restart | SQLite not writable | Ensure `data/` exists and is persisted |
| Socket DISCONNECTED | Firewall / CORS / SSL | Open WebSocket on API domain |
| Map layer error | Style race | Refresh page; check browser console |
| No markers | IMEI not in master registry | Add vehicle with matching IMEI |

---

## 11. Server Checklist

- [ ] Node.js 20+ installed
- [ ] `pnpm install && pnpm build` succeeds
- [ ] `.env.local` configured with production API URLs
- [ ] `data/` directory writable (SQLite)
- [ ] HTTPS reverse proxy (nginx/Caddy) for frontend
- [ ] GPS backend running with PM2/systemd
- [ ] MongoDB running and backed up
- [ ] TCP 5000 accessible from device network
- [ ] `/health` returns 200
- [ ] `/settings/system-health` all modules ONLINE

---

## 12. Hardware Checklist

- [ ] Teltonika FMM130 with active SIM (data plan)
- [ ] Codec 8 enabled (not Codec 8 Extended)
- [ ] Server host: `api-kodikz.giantphoenixllc.com`
- [ ] TCP port: `5000`
- [ ] GPS fix confirmed (outdoor test)
- [ ] IMEI recorded and entered in vehicle master
- [ ] External power / ignition wired per install guide
- [ ] Test device reports before fleet rollout

---

**Support contacts:** Configure per Dubai Municipality GISCD operations team.
