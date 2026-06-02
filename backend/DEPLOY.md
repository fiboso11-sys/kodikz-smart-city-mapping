# Kodikz GPS Backend — Ubuntu 22.04 VPS Deployment Guide

**Audience:** Infrastructure / DevOps  
**Scope:** Prepare and run the standalone Node.js backend on a VPS. **Do not deploy to Vercel.**  
The **Next.js frontend** remains on **Vercel** and calls this API over HTTPS.

---

## Deployment assets (in repo)

| File | Purpose |
|------|---------|
| `.env.example` | Environment variable template → copy to `.env` on server |
| `ecosystem.config.cjs` | PM2 process definition (`kodikz-gps`) |
| `deploy/nginx.conf.example` | Full Nginx reverse-proxy example (HTTP → HTTPS, `/health`) |
| `deploy/nginx/kodikz-gps-api.conf` | Minimal site config (HTTP only; use Certbot for TLS) |
| `deploy/scripts/healthcheck.sh` | Shell probe for monitoring (`curl` + exit code) |
| `DEPLOY.md` | This document |

---

## Architecture

```
Teltonika FMM130 ──TCP :5000──► Node.js (PM2)
                                    │
                               in-memory store
                                    │
                                    ├── HTTP 127.0.0.1:3000
                                    │
Vercel (Next.js) ──HTTPS──► Nginx ──┘   GET /vehicles, /health
```

| Port | Protocol | Bind | Public? |
|------|----------|------|-----------|
| **5000** | TCP (Codec 8) | `0.0.0.0` | Yes — UFW allow for devices |
| **3000** | HTTP (Express) | `127.0.0.1` | No — Nginx only |
| **443** | HTTPS (Nginx) | `0.0.0.0` | Yes — frontend + monitors |

---

## Prerequisites

- Ubuntu **22.04 LTS** (or 24.04)
- Public IPv4 (or DNS `A` record to VPS)
- Domain for API, e.g. `api.example.com`
- Git access to this repository
- Vercel production URL(s) for `CORS_ORIGIN`

---

## 1. System packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw jq

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x

# PM2 (global)
sudo npm install -g pm2
```

---

## 2. Application directory

```bash
sudo mkdir -p /opt/kodikz-gps
sudo chown "$USER:$USER" /opt/kodikz-gps
cd /opt/kodikz-gps

git clone <REPOSITORY_URL> .
cd backend
npm ci --omit=dev
```

---

## 3. Environment configuration

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

**Production minimum:**

```env
NODE_ENV=production
HOST=0.0.0.0
TCP_PORT=5000
API_HOST=127.0.0.1
API_PORT=3000
CORS_ORIGIN=https://your-app.vercel.app
TRUST_PROXY=true
```

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` on VPS |
| `HOST` | TCP bind (devices) — use `0.0.0.0` |
| `TCP_PORT` | Teltonika port — default `5000` |
| `API_HOST` | Express bind — use `127.0.0.1` behind Nginx |
| `API_PORT` | Express port — default `3000` |
| `CORS_ORIGIN` | Comma-separated Vercel URL(s) |
| `TRUST_PROXY` | `true` when behind Nginx |
| `SIMULATION_MODE` | `true` — synthetic Dubai GPS every 2s (TCP disabled); API unchanged |
| `SIMULATION_INTERVAL_MS` | Tick interval (default `2000`) |
| `SIMULATION_IMEIS` | Comma-separated device IMEIs (optional defaults) |
| `TCP_HANDSHAKE_TIMEOUT_MS` | IMEI login timeout (default `30000`) |
| `TCP_MAX_BUFFER_BYTES` | Per-socket buffer cap (default `262144`) |
| `API_KEY` | Optional — auth for `/vehicle`, `/vehicles` (leave unset for Vercel browser) |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | HTTP rate limit per IP |

### Simulation mode (staging / demos)

```env
SIMULATION_MODE=true
SIMULATION_INTERVAL_MS=2000
```

- Writes to the same in-memory store as Teltonika devices
- `GET /vehicle` and `GET /vehicles` responses are identical in shape to live data
- Frontend needs no changes — set vehicle `imei` or `NEXT_PUBLIC_GPS_IMEI` to match a simulated IMEI
- Teltonika TCP listener is **not** started (port 5000 unused)

---

## 4. PM2

```bash
cd /opt/kodikz-gps/backend
mkdir -p logs

pm2 start ecosystem.config.cjs --env production
pm2 status
pm2 logs kodikz-gps --lines 50

pm2 save
pm2 startup
# Run the command printed by `pm2 startup`, then:
pm2 save
```

**Useful commands:**

```bash
pm2 restart kodikz-gps
pm2 stop kodikz-gps
pm2 monit
```

Logs: `backend/logs/pm2-out.log`, `backend/logs/pm2-error.log`

---

## 5. Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp
sudo ufw enable
sudo ufw status
```

**Do not** open port `3000` to the internet.

---

## 6. Nginx

```bash
sudo cp /opt/kodikz-gps/backend/deploy/nginx.conf.example \
  /etc/nginx/sites-available/kodikz-gps-api

sudo sed -i 's/api.yourdomain.com/api.YOUR_REAL_DOMAIN/g' \
  /etc/nginx/sites-available/kodikz-gps-api

sudo ln -sf /etc/nginx/sites-available/kodikz-gps-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

**TLS (Let's Encrypt):**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.YOUR_REAL_DOMAIN
```

Certbot updates the site config with `ssl_certificate` paths and renews automatically.

---

## 7. Health checks

### Endpoint

`GET /health` — JSON response; **HTTP 200** when TCP and HTTP listeners are up, **503** during startup.

Example (healthy):

```json
{
  "status": "ok",
  "service": "kodikz-gps-backend",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-05-26T12:00:00.000Z",
  "uptimeSec": 3600,
  "checks": { "tcp": "up", "http": "up" },
  "devices": 3,
  "ports": { "tcp": 5000, "api": 3000 }
}
```

### Verify after deploy

```bash
# On VPS (direct to Node)
curl -s http://127.0.0.1:3000/health | jq

# Public (via Nginx + TLS)
curl -s https://api.YOUR_REAL_DOMAIN/health | jq

# Monitoring script
chmod +x deploy/scripts/healthcheck.sh
./deploy/scripts/healthcheck.sh http://127.0.0.1:3000/health
./deploy/scripts/healthcheck.sh https://api.YOUR_REAL_DOMAIN/health
```

Point uptime monitors at `https://api.YOUR_REAL_DOMAIN/health` and expect `"status":"ok"`.

---

## 8. Teltonika FMM130

### Codec requirement (do this first)

FMM130 defaults to **Codec 8 Extended** — this backend only supports **Codec 8**.

1. Teltonika Configurator → **System → Data Protocol**
2. **Parameter 113 = 0** → select **Codec 8**
3. Do **not** use Codec 8 Extended (8E) or Codec JSON

Guide: [`docs/FMM130-CONFIGURATION.md`](./docs/FMM130-CONFIGURATION.md)

### Server settings

| Field | Value |
|-------|--------|
| Server IP | VPS public IP |
| Port | `5000` |
| Protocol | TCP |

Verify first AVL packet codec ID = **`0x08`**.

After a device connects, confirm data:

```bash
curl -s http://127.0.0.1:3000/vehicles | jq
```

Optional simulator (on VPS, from `backend/`):

```bash
npm run simulate
```

---

## 9. Vercel frontend (separate project)

In the Vercel dashboard for the **frontend** app:

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_GPS_API_URL` | `https://api.YOUR_REAL_DOMAIN` |
| `NEXT_PUBLIC_GPS_PROVIDER` | `teltonika` |

Redeploy Vercel after changing variables. Ensure `CORS_ORIGIN` on the VPS includes the exact Vercel URL (scheme + host, no trailing slash).

---

## 10. Release / upgrade procedure

```bash
cd /opt/kodikz-gps
git pull
cd backend
npm ci --omit=dev
pm2 restart kodikz-gps
curl -s http://127.0.0.1:3000/health | jq .status
```

---

## 11. Troubleshooting

| Symptom | Check |
|---------|--------|
| `/health` returns 503 | `pm2 logs kodikz-gps` — wait for TCP/API listen messages |
| CORS errors in browser | `CORS_ORIGIN` matches Vercel URL exactly |
| Devices not connecting | UFW `5000/tcp`, FMM130 server IP/port, `pm2 logs` for `[TCP] IMEI` |
| 502 from Nginx | `curl http://127.0.0.1:3000/health` — PM2 running? `API_HOST=127.0.0.1` |
| Empty `/vehicles` | Device IMEI must match vehicle registry in frontend seed/data |

---

## 12. Security checklist

- [ ] `.env` mode `600`, not in git
- [ ] `API_HOST=127.0.0.1` — port 3000 not public
- [ ] `CORS_ORIGIN` set to known Vercel host(s) only
- [ ] TLS on Nginx (`certbot`)
- [ ] SSH key-only login (disable password auth)
- [ ] Regular `apt upgrade` and certbot renewals

---

## Support contacts

Document your internal owner, on-call rotation, and repository URL in your runbook copy of this file.
