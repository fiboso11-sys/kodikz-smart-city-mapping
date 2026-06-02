# Kodikz Dubai Mapping

Dubai Municipality Smart City **GIS mapping fleet monitor**.

> **Current release:** [`v1.0-rc1`](RELEASE-v1.0-rc1.md) — *Kodikz Fleet Platform Pilot Release* (Release Candidate)

## Project layout

| Folder | Purpose |
|--------|---------|
| **/** (root) | **Demo app** — simulated fleet, JSON seed, deployable to Vercel |
| **`/frontend`** | **Production UI** — same design, polls live GPS from backend |
| **`/backend`** | **Production GPS** — Teltonika TCP :5000 + Express API :3001 (VPS) |

## Demo (no hardware)

```bash
pnpm install
pnpm seed
pnpm dev
```

Open http://localhost:3000 — simulator drives 60 vehicles.

## Production (Teltonika FMM130)

### 1. Backend on VPS

```bash
cd backend
npm install
cp .env.example .env
npm start
```

- Devices → `YOUR_VPS_IP:5000` (Codec 8)
- API → `http://127.0.0.1:3000` (Nginx HTTPS public URL for Vercel)

### 2. Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.local
# Edit NEXT_PUBLIC_GPS_API_URL=https://api.YOUR_DOMAIN
pnpm dev
```

Map markers update every **2.5s** from `GET /vehicles`.

## Data flow

```
Teltonika FMM130 → TCP :5000 → teltonika-parser → in-memory store → GET /vehicle(s) → Next.js map
```

## Live demo URLs

- https://kodikz-dubai-mapping.vercel.app (demo build from root)

**Frontend** → deploy `frontend/` folder on **Vercel**.  
**Backend** → Ubuntu VPS only — see `backend/DEPLOY.md` (PM2 + Nginx).
