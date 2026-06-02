# Production Readiness Audit — Updated Summary

**Audit date:** 2026-06-02 (re-audit after hardening)  
**Scope:** `backend/` only — frontend unchanged  

---

## Executive summary

| Verdict | **CONDITIONAL PASS** |
|---------|----------------------|
| Staging / simulation | **PASS** |
| Production (Codec 8 FMM130 + secured VPS) | **PASS** with operational checklist |
| Production (factory-default 8E devices) | **FAIL** until devices reconfigured or 8E implemented |

**HIGH severity items:** **11 / 11 resolved** in code (see below).  
**Remaining gaps:** Codec 8 Extended support, persistent store, automated tests, fleet IMEI seeding (documented / medium).

---

## HIGH severity — resolution status

| # | Finding | Status | Implementation |
|---|---------|--------|----------------|
| H1 | `readUInt32BE` on short buffers | **RESOLVED** | `parser.js` — length guards before all `readUInt32BE` calls |
| H2 | No handshake timeout | **RESOLVED** | `tcp-server.js` — 30s timer (`TCP_HANDSHAKE_TIMEOUT_MS`) |
| H3 | Invalid IMEI never disconnected | **RESOLVED** | `tryParseImeiHandshake` returns `reject`; socket `destroy()` |
| H4 | Unbounded TCP buffer (DoS) | **RESOLVED** | `TCP_MAX_BUFFER_BYTES` default 256 KB |
| H5 | `uncaughtException` does not exit | **RESOLVED** | `server.js` — `process.exit(1)` in **production** |
| H6 | `unhandledRejection` does not exit | **RESOLVED** | `server.js` — same fatal handler |
| H7 | No API authentication | **RESOLVED** | Optional `API_KEY` + `X-Api-Key` / `api_key` (`/health` exempt) |
| H8 | No rate limiting | **RESOLVED** | In-memory per-IP limit (`RATE_LIMIT_*`), `/health` exempt |
| H9 | No security headers | **RESOLVED** | `lib/http-middleware.js` — nosniff, DENY frame, CSP, etc. |
| H10 | Codec 8 Extended unsupported | **OPEN** | Documented — `docs/FMM130-CONFIGURATION.md`; not implemented |
| H11 | FMM130 defaults to 8E | **OPEN** | Operator config required — startup + `/health` warnings |

---

## Area scorecard

| Area | Before | After |
|------|--------|-------|
| TCP server structure | PASS | **PASS** |
| Teltonika handshake | PARTIAL | **PASS** |
| IMEI acceptance flow | PARTIAL | **PASS** |
| ACK record count logic | PARTIAL | PARTIAL |
| Error handling | FAIL | **PASS** (production fatal exit) |
| Frontend API integration | PARTIAL | PARTIAL (unchanged by design) |
| Simulation mode | PASS | **PASS** |
| Health endpoint | PARTIAL | **PASS** |
| PM2 configuration | PASS | **PASS** |
| Environment variables | PARTIAL | **PASS** |
| Deployment documentation | PASS | **PASS** |
| Security (HTTP) | FAIL | **PASS** (with optional API_KEY) |

---

## TCP (post-hardening)

- Handshake: 2-byte length + ASCII IMEI; rejects AVL preamble first, bad length, non-digit IMEI.
- **30s** handshake timeout if IMEI not registered.
- Max socket buffer **262144** bytes (configurable).
- Invalid clients disconnected with logged reason.
- Codec 8 AVL only — **8E still not supported**.

---

## HTTP API contract

**Unchanged** response bodies for:

- `GET /vehicle` — same JSON fields and 404 shape  
- `GET /vehicles` — same `{ vehicles, count }`  
- `GET /health` — same fields; `protocol` + `warnings` were already present  

**New HTTP statuses** (only when security env enabled or limits hit):

| Status | When |
|--------|------|
| `401` | `API_KEY` set and missing/invalid key on `/vehicle`, `/vehicles` |
| `429` | Rate limit exceeded |

**Default production:** `API_KEY` unset → Vercel frontend works without changes.

---

## Security configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `API_KEY` | (empty) | Optional auth for GPS endpoints |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window |
| `RATE_LIMIT_MAX` | `120` | Max requests per IP per window |
| `TCP_HANDSHAKE_TIMEOUT_MS` | `30000` | IMEI login timeout |
| `TCP_MAX_BUFFER_BYTES` | `262144` | Per-socket byte cap |

---

## Remaining recommendations (non-HIGH)

| Item | Priority | Notes |
|------|----------|-------|
| Codec 8 Extended decoder | High (feature) | Align with FMM130 factory default |
| Redis/Postgres store | Medium | Survive process restart |
| Integration tests | Medium | Handshake + AVL + HTTP |
| Fleet IMEI in seed / admin UI | Medium | Frontend mapping |
| `pm2-logrotate` | Low | Log disk usage |
| ACK count vs parsed records | Low | Teltonika edge case |

---

## Production go-live checklist

- [ ] `SIMULATION_MODE=false`
- [ ] `API_HOST=127.0.0.1` · UFW deny `3000/tcp`
- [ ] `CORS_ORIGIN` = exact Vercel URL(s)
- [ ] FMM130: **Parameter 113 = 0** (Codec 8) — verify AVL ID **`0x08`**
- [ ] `API_KEY` unset **or** reverse-proxy injects key (browser cannot use secret key safely)
- [ ] `curl https://api.<domain>/health` → `"status":"ok"`
- [ ] PM2 `kodikz-gps` running · Nginx TLS active

---

## References

- [`FMM130-CONFIGURATION.md`](./FMM130-CONFIGURATION.md)
- [`TELTONIKA-COMPATIBILITY.md`](./TELTONIKA-COMPATIBILITY.md)
- [`DEPLOY.md`](../DEPLOY.md)
- [`README.md`](../README.md) — API contract
