# Kodikz Dubai Mapping — Production Frontend

Same UI as the **demo app** (repository root), but live GPS from the Node backend.

## Setup

```bash
cd frontend
pnpm install
cp .env.example .env.local
```

Start the **backend** first (`../backend`), then:

```bash
pnpm dev
```

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GPS_API_URL` | VPS API URL — production: `https://api.yourdomain.com` (Nginx → port 3000) |
| `NEXT_PUBLIC_GPS_PROVIDER` | Set `teltonika` for live API; omit for simulator |

Assign each vehicle's `imei` in the registry to match the FMM130 device IMEI string.

## Deploy

- **Frontend**: Vercel / any static host (`pnpm build`)
- **Backend**: Ubuntu VPS (`../backend`) — TCP **5000**, API **3000** behind Nginx
- **Frontend**: Vercel — set env vars to your `https://api...` URL
