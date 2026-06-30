# API Reference

## Next.js Portal API (`/api/*`)

All routes use `export const runtime = "nodejs"` and `dynamic = "force-dynamic"`.

Base URL: `https://your-portal-domain.com` (local: `http://localhost:3000`)

---

### Vehicles

#### `GET /api/vehicles`

List all vehicles in master registry.

**Response 200:**
```json
{ "vehicles": [...], "count": 0 }
```

#### `POST /api/vehicles`

Create vehicle. Requires `imei`, `plateNumber`.

**Response 201:** Vehicle object  
**Response 400:** Validation error  
**Response 409:** Duplicate IMEI

#### `GET /api/vehicles/:id`

Get vehicle by ID.

#### `PUT /api/vehicles/:id`

Update vehicle.

#### `DELETE /api/vehicles/:id`

Delete vehicle.

#### `GET /api/vehicles/live`

Fleet with live GPS merge.

**Response 200:**
```json
{
  "vehicles": [{ "...master": "...", "live": { "imei", "latitude", "longitude", "speed", "timestamp" }, "liveStatus": "moving|idle|offline" }],
  "count": 0,
  "source": "gps|master",
  "warning": "optional"
}
```

---

### Permits

#### `GET /api/permits`

List permits.

#### `POST /api/permits`

Create permit.

#### `GET /api/permits/:id`

Get permit.

#### `PUT /api/permits/:id`

Update permit.

#### `DELETE /api/permits/:id`

Delete permit.

#### `POST /api/permits/:id/upload-route`

Upload GeoJSON route (LineString / MultiLineString).

**Body:**
```json
{ "geojson": { "type": "FeatureCollection", "features": [...] }, "name": "...", "fileName": "..." }
```

#### `POST /api/permits/:id/upload-area`

Upload GeoJSON area (Polygon / MultiPolygon).

---

### Geo Uploads

#### `GET /api/geo-uploads`

List uploaded route/area layers.

---

### System Health

#### `GET /api/system-health`

Module status for dashboard.

**Response 200:**
```json
{
  "overall": "ONLINE|DEGRADED",
  "checkedAt": "ISO-8601",
  "modules": {
    "backendApi": { "status": "ONLINE|OFFLINE", "url": "...", "detail": "..." },
    "socket": { "status": "...", "url": "...", "detail": "..." },
    "database": { "status": "...", "backend": "sqlite|memory", "path": "..." },
    "geoUpload": { "status": "...", "detail": "..." }
  }
}
```

---

### GPS Proxy

#### `GET /api/gps/health`

Proxies VPS `GET /health`. Returns error if URL misconfigured to localhost.

#### `GET /api/gps/history/:imei`

Query: `?limit=50`  
Proxies VPS position history.

---

## External GPS Backend API

Base: `NEXT_PUBLIC_API_URL` (default `https://api-kodikz.giantphoenixllc.com`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health |
| GET | `/vehicles` | Live fleet snapshot |
| GET | `/vehicles/live` | Alias for live fleet |
| GET | `/vehicle/:imei` | Single device |
| GET | `/history/:imei` | Position history |

### Socket.IO

| Event | Direction | Payload |
|-------|-----------|---------|
| `location_update` | Server → Client | `{ imei, latitude, longitude, speed, heading, timestamp, ... }` |

Path: `/socket.io`  
Transports: `websocket`, `polling`
