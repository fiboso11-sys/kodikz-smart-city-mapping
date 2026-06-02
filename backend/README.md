# Kodikz GPS Backend — Integration Contract

This document defines the **HTTP API** and **Teltonika TCP** interface for external teams integrating with the Kodikz GPS backend.

| Channel | Default | Purpose |
|---------|---------|---------|
| **HTTP API** | Port **3000** (HTTPS via Nginx in production) | Read latest vehicle positions |
| **Device TCP** | Port **5000** | Teltonika trackers send GPS (Codec 8) |

> **Base URL (production):** `https://api.<your-domain>` (Nginx → `127.0.0.1:3000`)  
> **Base URL (local):** `http://127.0.0.1:3000`

All HTTP responses use **`Content-Type: application/json`**.  
Only **`GET`** methods are supported on the public API.

---

## HTTP API

### `GET /vehicle`

Returns the **latest known position** for one device.

#### Query parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `imei` | No | 8–20 digit device IMEI. If omitted, returns the most recently updated device in the store. |

#### Request examples

```http
GET /vehicle HTTP/1.1
Host: api.example.com
```

```http
GET /vehicle?imei=352093089674033 HTTP/1.1
Host: api.example.com
```

#### Success response

| HTTP status | `200 OK` |
|-------------|----------|

**Response body** — single JSON object:

| Field | Type | Description |
|-------|------|-------------|
| `imei` | `string` | Device IMEI (8–20 digits) |
| `latitude` | `number` | WGS84 latitude (decimal degrees) |
| `longitude` | `number` | WGS84 longitude (decimal degrees) |
| `speed` | `number` | Speed in **km/h** |
| `heading` | `number` | Course in degrees (`0`–`360`, clockwise from north) |
| `timestamp` | `string` | ISO-8601 UTC time of the GPS fix from the device |
| `ignition` | `boolean` \| `null` | IO 239 when present; else speed > 2 km/h → `true`; else `null` |
| `batteryVoltage` | `number` \| `null` | Battery voltage in **volts** (IO 67, mV → V) |
| `externalPower` | `boolean` \| `null` | External supply connected (IO 66, threshold ≥ 9 V) |
| `gsmSignal` | `number` \| `null` | GSM signal strength **0–5** (IO 21) |
| `satellites` | `number` \| `null` | GPS satellites in fix (AVL GPS block) |
| `receivedAt` | `string` | ISO-8601 UTC time when the server stored this record |

#### Example response (`200 OK`)

```json
{
  "imei": "352093089674033",
  "latitude": 25.07890743838007,
  "longitude": 55.14736311372688,
  "speed": 52.7,
  "heading": 28.4,
  "timestamp": "2026-06-02T13:25:24.812Z",
  "ignition": true,
  "batteryVoltage": 13.42,
  "externalPower": true,
  "gsmSignal": 4,
  "satellites": 12,
  "receivedAt": "2026-06-02T13:25:24.812Z"
}
```

#### Error responses

| HTTP status | When | Response body |
|-------------|------|-----------------|
| **`404 Not Found`** | No GPS data in store yet for the requested IMEI (or store is empty) | See below |
| **`502` / connection errors** | Nginx cannot reach the Node process | Platform-specific (Nginx) |

**`404 Not Found` example**

```json
{
  "error": "No GPS data received yet",
  "imei": "352093089674033"
}
```

When `imei` was not passed in the query string, the `imei` field in the error body is `null`:

```json
{
  "error": "No GPS data received yet",
  "imei": null
}
```

#### Integration notes

- Poll interval used by Kodikz clients: **every 2 seconds**.
- Data is **last-known-value** only; there is no history endpoint on this service.
- CORS is enforced in production — your browser origin must be allow-listed via server `CORS_ORIGIN`.
- Responses from live Teltonika devices and from server-side simulation mode are **identical** in shape.

---

### `GET /vehicle/:imei`

Returns the latest position for one device (path parameter).

```http
GET /vehicle/352093089674033 HTTP/1.1
Host: api.example.com
```

Same JSON body and errors as `GET /vehicle?imei=…`.

---

### `GET /vehicles` (fleet)

Returns all devices with a stored position (latest per IMEI).

#### Success response (`200 OK`)

```json
{
  "vehicles": [
    {
      "imei": "352093089674033",
      "latitude": 25.07890743838007,
      "longitude": 55.14736311372688,
      "speed": 52.7,
      "heading": 28.4,
      "timestamp": "2026-06-02T13:25:24.812Z",
      "ignition": true,
      "receivedAt": "2026-06-02T13:25:24.812Z"
    }
  ],
  "count": 1
}
```

Each element in `vehicles` uses the **same schema** as `GET /vehicle`.

---

### `GET /health` (operations)

Liveness / readiness for load balancers and monitoring.

| HTTP status | Meaning |
|-------------|---------|
| `200` | HTTP and TCP listeners ready |
| `503` | Process starting |

```json
{
  "status": "ok",
  "service": "kodikz-gps-backend",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-06-02T13:25:24.812Z",
  "uptimeSec": 3600,
  "checks": { "tcp": "up", "http": "up" },
  "devices": 3,
  "connectedDevices": 3,
  "reportingDevices": 3,
  "dataMode": "live",
  "lastPacketReceivedAt": "2026-06-02T13:25:24.812Z",
  "ports": { "tcp": 5000, "api": 3000 },
  "protocol": {
    "supported": ["Codec 8 (codec ID 0x08)"],
    "notSupported": ["Codec 8 Extended / 8E (codec ID 0x8E)", "Codec JSON"],
    "fmm130Parameter113Required": 0,
    "verifyAvlCodecId": "0x08"
  },
  "warnings": [
    "Teltonika Codec 8 Extended (0x8E) and Codec JSON are NOT supported.",
    "FMM130 factory default is Codec 8 Extended — set Parameter 113 = 0 (Codec 8) in Configurator before connecting."
  ]
}
```

---

## Device TCP interface (Teltonika)

Hardware and device-configuration teams use this section. The HTTP API above reads from the same in-memory store populated by TCP (or by simulation mode on the server).

### FMM130 compatibility requirement (required before connect)

1. Open **Teltonika Configurator**
2. **System → Data Protocol**
3. Set **Parameter 113 = 0** → select **Codec 8**

**Do not use:** Codec 8 Extended (8E) · Codec JSON

| Backend support | |
|-----------------|--|
| Supported | Codec 8 (`0x08`) |
| Not supported | Codec 8 Extended (`0x8E`), Codec JSON |

After saving: **VPS public IP**, **TCP 5000**, **TCP**. Verify first AVL packet codec ID **`0x08`**.

Full guide: [`docs/FMM130-CONFIGURATION.md`](./docs/FMM130-CONFIGURATION.md)

### Requirements

| Item | Value |
|------|--------|
| **Port** | **5000** (configurable via `TCP_PORT`) |
| **Protocol** | **TCP** (plain, not TLS) |
| **Codec** | **Teltonika Codec 8** (AVL data over TCP) |
| **Compatible devices** | Teltonika FMM130 and other Codec 8 TCP devices |
| **Firewall** | Inbound **TCP 5000** open on the VPS public IP or DNS name |
| **Nginx** | Do **not** proxy this port — devices connect directly to the Node listener |

### Connection lifecycle

```
┌──────────┐                              ┌──────────────┐
│ Device   │                              │ Kodikz server│
└────┬─────┘                              └──────┬───────┘
     │  TCP connect (port 5000)                   │
     │──────────────────────────────────────────>│
     │  1. IMEI packet (see below)                │
     │──────────────────────────────────────────>│
     │  2. IMEI ACK (1 byte: 0x01)                │
     │<──────────────────────────────────────────│
     │  3. AVL Codec 8 packet(s)                  │
     │──────────────────────────────────────────>│
     │  4. AVL ACK (4 bytes, record count BE)     │
     │<──────────────────────────────────────────│
     │  (steps 3–4 repeat while connected)        │
     │  TCP close / reconnect                     │
     └────────────────────────────────────────────┘
```

### Step 1 — IMEI handshake (device → server)

First message on a **new TCP connection** must be the IMEI frame (not AVL).

| Offset | Size | Content |
|--------|------|---------|
| 0 | 2 bytes | IMEI length **N** (big-endian uint16) |
| 2 | N bytes | IMEI as **ASCII digits** (typically 15 characters) |

**Example** (IMEI `352093089674033`, 15 bytes):

```
00 0F  33 35 32 30 39 33 30 38 39 36 37 34 30 33 33
^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
length IMEI ASCII
```

Rules enforced by the server:

- AVL preamble (`0x00000000` at offset 0) must **not** be sent as the first message.
- IMEI length must be **8–20**.
- IMEI must match `/^\d{8,20}$/`.

### Step 2 — IMEI ACK (server → device)

| Format | 1 byte: **`0x01`** |

If the handshake is invalid, the server closes the connection without sending AVL ACKs.

### Step 3 — AVL packet (device → server)

Standard **Teltonika TCP Codec 8** frame:

| Section | Description |
|---------|-------------|
| 4 bytes | Preamble `0x00000000` |
| 4 bytes | Data field length (big-endian) |
| N bytes | AVL data (Codec 8) |
| 4 bytes | CRC-16 |

The server buffers bytes until a full frame is received, parses GPS records, and updates the store used by `GET /vehicle`.

Extracted fields per record:

| Field | Source |
|-------|--------|
| `latitude` / `longitude` | GPS element |
| `speed` | km/h |
| `heading` | `angle` (degrees) |
| `timestamp` | Record timestamp (ISO-8601 in API) |

### Step 4 — AVL ACK (server → device)

| Format | 4 bytes, **big-endian uint32** = number of AVL records accepted |

The device should wait for this ACK before sending the next AVL packet (per Teltonika TCP spec).

### Device configuration checklist

| Setting | Value |
|---------|--------|
| Server host | VPS public IP or DNS (e.g. `api.example.com` if pointed at VPS) |
| Server port | **5000** |
| Protocol | TCP |
| Data protocol | Codec 8 |
| TLS | Off (plain TCP) |

### Operational notes

- Multiple devices may connect concurrently; each connection is tracked by IMEI after handshake.
- On parse errors, the server logs the error and clears its buffer for that socket; the device should reconnect.
- When `SIMULATION_MODE=true` on the server, the TCP listener is **disabled**; HTTP responses still work from synthetic data.

---

## Data flow summary

```
Teltonika FMM130 ──TCP:5000 (Codec 8)──> In-memory store <── HTTP :3000
                                              │
                                              ├── GET /vehicle
                                              └── GET /vehicles
```

---

## Related documentation

| Document | Audience |
|----------|----------|
| [`docs/FMM130-CONFIGURATION.md`](./docs/FMM130-CONFIGURATION.md) | Field ops — Codec 8 device setup |
| [`docs/TELTONIKA-COMPATIBILITY.md`](./docs/TELTONIKA-COMPATIBILITY.md) | Integrators — codec support matrix |
| [`DEPLOY.md`](./DEPLOY.md) | DevOps — Ubuntu, PM2, Nginx, firewall |
| [`.env.example`](./.env.example) | Environment variables |

## Versioning

API response fields are **additive** — new optional JSON fields may appear in minor releases. Clients should ignore unknown fields.

Service version is reported in `GET /health` → `version`.
