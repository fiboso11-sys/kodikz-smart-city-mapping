# kodikz-gps-backend

Production-grade **IoT GPS fleet tracking backend** for **Teltonika FMM130** devices. Ingests live positions over TCP (Codec 8), exposes REST APIs and **Socket.IO** real-time updates, and persists data in **MongoDB** (with in-memory fallback when MongoDB is unavailable).

Designed for **VPS deployment** behind Nginx at `api-kodikz.giantphoenixllc.com` — not Vercel.

| | |
|---|---|
| **Production API** | `https://api-kodikz.giantphoenixllc.com` |
| **TCP (devices)** | VPS public IP, port **5000** |
| **HTTP (API)** | Port **3000** (Nginx TLS in front) |

---

## Features

| Capability | Description |
|------------|-------------|
| **TCP server** | Teltonika IMEI handshake (`0x01` ACK), multi-device, buffer limits |
| **Codec 8** | AVL parsing via `teltonika-parser` (8E / JSON **not** supported) |
| **REST API** | Latest position, fleet list, GPS history (default 50 points) |
| **MongoDB** | Latest document per IMEI + append-only history |
| **Socket.IO** | `location_update` event on every GPS fix |
| **Docker** | Optional `docker compose up -d` |
| **Security** | CORS, rate limiting, optional API key, malformed packet isolation |

---

## Architecture

```
  Teltonika FMM130 (Codec 8, TCP :5000)
           │
           ▼
  ┌────────────────────────────────────┐
  │  backend (Node.js)                 │
  │  tcp/server.js      → parser       │
  │  services/locationStore → MongoDB  │
  │  api/routes.js      :3000          │
  │  socket/socket.js   location_update│
  └──────────────┬─────────────────────┘
                 │
       Nginx :443 (api-kodikz.giantphoenixllc.com)
                 │
       Frontend map app (REST + Socket.IO)
```

---

## Project structure

```
backend/
├── tcp/
│   └── server.js          # Teltonika TCP :5000
├── api/
│   ├── routes.js          # REST endpoints
│   └── middleware.js      # CORS, rate limit, API key
├── services/
│   ├── parser.js          # Codec 8 + IMEI handshake
│   ├── locationStore.js   # Memory + Mongo + Socket emit
│   ├── logger.js
│   └── runtime.js
├── models/
│   └── Location.js        # Mongoose latest + history
├── socket/
│   └── socket.js          # Socket.IO
├── config/
│   ├── index.js           # Env (PORT, TCP_PORT, DOMAIN, …)
│   └── db.js              # Mongo connection
├── app.js                 # HTTP + Socket bootstrap
├── server.js              # Entry point
├── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick start (Docker)

### Prerequisites

- Docker 24+ and Docker Compose v2
- VPS with ports **5000** (TCP) and **443** (HTTPS API via Nginx) reachable

### Install

```bash
git clone https://github.com/fiboso11-sys/kodikz-gps-backend.git
cd kodikz-gps-backend
cp .env.example .env
```

Edit `.env` — set at minimum:

```env
DOMAIN=api-kodikz.giantphoenixllc.com
PUBLIC_API_URL=https://api-kodikz.giantphoenixllc.com
CORS_ORIGIN=https://your-frontend-domain.com
MONGO_URI=mongodb://mongo:27017/kodikz
```

### Run

```bash
docker compose up -d
```

Verify:

```bash
curl -s http://localhost:3000/health
docker compose logs -f backend
```

---

## Quick start (VPS — Node.js, no Docker)

Use this when deploying directly on Ubuntu/Debian with **PM2** or **systemd**.

### 1. Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Clone and configure

```bash
git clone https://github.com/fiboso11-sys/kodikz-gps-backend.git
cd kodikz-gps-backend
cp .env.example .env
nano .env
```

Example `.env` for production:

```env
NODE_ENV=production
PORT=3000
TCP_PORT=5000
HOST=0.0.0.0
MONGO_URI=mongodb://127.0.0.1:27017/kodikz
DOMAIN=api-kodikz.giantphoenixllc.com
PUBLIC_API_URL=https://api-kodikz.giantphoenixllc.com
CORS_ORIGIN=https://your-frontend.vercel.app
TRUST_PROXY=true
```

### 3. MongoDB (recommended)

```bash
sudo apt install -y mongodb-org   # or use Atlas connection string in MONGO_URI
```

If MongoDB is down at startup, the API still runs using **in-memory** storage until Mongo reconnects on restart.

### 4. Install and start

```bash
npm install
npm start
```

Health check:

```bash
curl -s http://127.0.0.1:3000/health
```

### 5. Process manager (PM2)

```bash
sudo npm install -g pm2
pm2 start server.js --name kodikz-gps
pm2 save
pm2 startup
```

### 6. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp    # Teltonika devices only
sudo ufw enable
```

Do **not** expose port 3000 publicly — Nginx proxies to `127.0.0.1:3000`.

---

## Nginx reverse proxy + domain

Point DNS **A record** for `api-kodikz.giantphoenixllc.com` to your VPS IP.

Example site config (full file: [`docs/nginx-reverse-proxy.conf`](docs/nginx-reverse-proxy.conf)):

```nginx
server {
    listen 443 ssl http2;
    server_name api-kodikz.giantphoenixllc.com;

    ssl_certificate     /etc/letsencrypt/live/api-kodikz.giantphoenixllc.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-kodikz.giantphoenixllc.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

TLS:

```bash
sudo certbot --nginx -d api-kodikz.giantphoenixllc.com
sudo nginx -t && sudo systemctl reload nginx
```

---

## Ports

| Port | Protocol | Exposure | Purpose |
|------|----------|----------|---------|
| **5000** | TCP | Public (UFW) | Teltonika FMM130 device data |
| **3000** | HTTP + WebSocket | Localhost only | REST API + Socket.IO |
| **443** | HTTPS | Public (Nginx) | `api-kodikz.giantphoenixllc.com` |

Do **not** expose MongoDB (27017) to the internet.

---

## REST API

All responses are **JSON**.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health (no API key) |
| GET | `/vehicle` | All vehicles, or `?imei=` for one device |
| GET | `/vehicle/:imei` | Latest position for IMEI |
| GET | `/vehicles` | Fleet snapshot (alias) |
| GET | `/history/:imei` | Last **50** points (`?limit=` max 500) |

### Examples

```bash
curl -s https://api-kodikz.giantphoenixllc.com/health
curl -s https://api-kodikz.giantphoenixllc.com/vehicle
curl -s https://api-kodikz.giantphoenixllc.com/vehicle/352093089674033
curl -s "https://api-kodikz.giantphoenixllc.com/history/352093089674033?limit=50"
```

### Sample location object

```json
{
  "imei": "352093089674033",
  "latitude": 25.0789,
  "longitude": 55.14736,
  "speed": 52,
  "timestamp": "2026-05-26T12:00:00.000Z",
  "heading": 180,
  "ignition": true,
  "batteryVoltage": 12.4,
  "externalPower": true,
  "gsmSignal": 4,
  "satellites": 12,
  "receivedAt": "2026-05-26T12:00:01.000Z"
}
```

---

## Socket.IO (real-time)

```javascript
import { io } from "socket.io-client";

const socket = io("https://api-kodikz.giantphoenixllc.com", {
  path: "/socket.io",
  transports: ["websocket", "polling"],
});

socket.on("location_update", (payload) => {
  // { imei, latitude, longitude, speed, timestamp, ... }
});
```

---

## Teltonika FMM130 configuration

| Setting | Value |
|---------|--------|
| **Server IP** | VPS public IP |
| **Port** | **5000** |
| **Protocol** | **TCP** |
| **Parameter 113** | **0** (Codec 8) |
| **Codec** | **Codec 8** — not Codec 8 Extended (8E) |

Full guide: [`docs/FMM130-CONFIGURATION.md`](docs/FMM130-CONFIGURATION.md)

### Expected logs

```
[TCP] Device connect {"remote":"..."}
[TCP] IMEI received {"imei":"352093089674033",...}
[TCP] Packet received {"imei":"...","bytes":...}
[TCP] Parse success {"imei":"...","records":1,"lat":25.07,"lng":55.14,"speed":52}
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP API port |
| `TCP_PORT` | `5000` | Teltonika TCP port |
| `MONGO_URI` | — | MongoDB URI (empty = memory fallback) |
| `DOMAIN` | `api-kodikz.giantphoenixllc.com` | Public API hostname |
| `PUBLIC_API_URL` | `https://{DOMAIN}` | Advertised API URL |
| `CORS_ORIGIN` | `*` | Allowed browser origins (comma-separated) |
| `API_KEY` | (empty) | Optional auth for data routes |
| `SIMULATION_MODE` | `false` | Disable TCP listener (API-only test) |

See [`.env.example`](.env.example) for the full list.

---

## Security

- **Never commit** `.env` — listed in `.gitignore`
- Set **`CORS_ORIGIN`** to your real frontend domain in production
- Optional **`API_KEY`** for `/vehicle`, `/vehicles`, `/history` (not `/health`)
- TCP: handshake timeout, max buffer size; bad packets logged and isolated — process does not crash
- Rate limiting per client IP on HTTP routes

---

## Operations

```bash
# Docker logs
docker compose logs -f backend

# PM2
pm2 logs kodikz-gps
pm2 restart kodikz-gps

# Upgrade
git pull && npm install && pm2 restart kodikz-gps
# or: docker compose up -d --build
```

---

## Compatibility

| Protocol | Status |
|----------|--------|
| Codec 8 (`0x08`) | Supported |
| Codec 8 Extended (`0x8E`) | **Not supported** |
| Codec JSON | **Not supported** |

See [`docs/TELTONIKA-COMPATIBILITY.md`](docs/TELTONIKA-COMPATIBILITY.md).

---

## License

Proprietary — Kodikz / Giant Phoenix LLC. Internal and licensed deployment only.
