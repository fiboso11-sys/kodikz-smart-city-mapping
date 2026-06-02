# Teltonika Protocol Compatibility Report

**Product:** Kodikz GPS Backend (`kodikz-gps-backend`)  
**Dependency:** `teltonika-parser@^0.0.15`  
**Audit date:** 2026-06-02  
**Codec 8 Extended implementation:** Not present (by design)

---

## Executive summary

| Question | Answer |
|----------|--------|
| Is **Codec 8 Extended (8E / `0x8E`)** supported? | **No** |
| Will an **FMM130 factory-default** device work without reconfiguration? | **No** — default data protocol is **Codec 8 Extended** |
| Is **Codec 8 (`0x08`)** supported? | **Yes** (via `teltonika-parser`) |
| Action required before fleet go-live | Set FMM130 **Data Protocol → Codec 8** (parameter **113 = 0**) |

**Compatibility verdict:** **INCOMPATIBLE** with out-of-box FMM130 settings until devices are reconfigured to Codec 8.

---

## 1. Codecs supported by this backend

Support is determined entirely by `teltonika-parser` → `index.js` `switch (codec_id)`:

| Codec name | Codec ID (hex) | Codec ID (decimal) | Supported | Notes |
|------------|----------------|--------------------|-----------|-------|
| Codec 7 | `0x07` | 7 | **Yes** | Legacy FM devices |
| **Codec 8** | **`0x08`** | **8** | **Yes** | **Required for Kodikz backend today** |
| Codec 16 | `0x10` | 16 | **Partial** | Parser routes to `codec16.js` (marked “in process” in upstream README; not validated in Kodikz) |
| **Codec 8 Extended** | **`0x8E`** | **142** | **No** | Not in `switch`; AVL decode will not run |
| Codec 12 | `0x0C` | 12 | No | — |
| Codec 13 | `0x0D` | 13 | No | — |
| Codec 14 | `0x0E` | 14 | No | — |
| Codec JSON | — | — | No | FMM130 parameter 113 value `2` |

### Kodikz application layer

`backend/parser.js` comments and `README.md` state **Codec 8** only. There is no branch for `0x8E`. Unknown codec IDs result in:

- `_codec` undefined → empty / minimal `avl` object
- `records` undefined or empty → no `store.upsert`
- TCP may still send AVL ACK using `number_of_data` from a broken parse
- HTTP API remains **404** until valid Codec 8 GPS is stored

---

## 2. Codec 8 vs Codec 8 Extended (protocol difference)

Per [Teltonika Wiki — Codec](https://wiki.teltonika-gps.com/view/Codec):

| Property | Codec 8 | Codec 8 Extended |
|----------|---------|------------------|
| Codec ID | `0x08` | `0x8E` |
| AVL IO ID width | 1 byte (max ID 255) | 2 bytes (max ID 65535) |
| IO count fields | 1 byte each | 2 bytes each |
| Variable-length IO | No | Yes |
| TCP framing / IMEI handshake | Same | Same |

**Important:** IMEI login and TCP ACK rules are identical. Only the AVL payload inside the TCP frame differs. A server that only implements Codec 8 cannot decode `0x8E` AVL bodies.

---

## 3. Teltonika FMM130 default protocol

Sources:

- [FMM130 Parameter list](https://wiki.teltonika-gps.com/view/FMM130_Parameter_list) — parameter **113** “Data Protocol”
- [FMM130 System settings](https://wiki.teltonika-gps.com/view/FMM130_System_settings)
- [Which data protocol to choose Codec 8 or Codec 8 Extended](https://wiki.teltonika-gps.com/view/Which_data_protocol_to_choose_Codec_8_or_Codec_8_Extended)

| Parameter ID | Name | Default | Value `0` | Value `1` | Value `2` |
|--------------|------|---------|-----------|-----------|-----------|
| **113** | **Data Protocol** | **1** | Codec 8 | **Codec 8 Extended** | Codec JSON |

**Conclusion:** FMM130 ships with **Codec 8 Extended** as the factory default (`113 = 1`).

Teltonika’s own guidance recommends **Codec 8 Extended** for new integrations because it supports all AVL IDs and variable IO elements. Kodikz backend intentionally targets **Codec 8** only until 8E support is implemented.

### Firmware nuance

Some firmware builds may auto-select 8 vs 8E based on enabled IO elements (IDs &gt; 255 force 8E). Treat **first received AVL byte 9 (codec ID)** as ground truth during commissioning.

---

## 4. FMM130 configuration required (Codec 8 only)

Until Codec 8 Extended is implemented, **every FMM130** must send **`0x08`**.

**Operator checklist:** [`FMM130-CONFIGURATION.md`](./FMM130-CONFIGURATION.md)

### Option A — Teltonika Configurator (recommended)

1. Connect device via USB/BT to **Teltonika Configurator**.
2. Open **System** (or **System settings**).
3. Set **Data Protocol** = **Codec 8** (not “Codec 8 Extended”, not “Codec JSON”).
4. Configure **GPRS** server: host = VPS IP/DNS, port = **5000**, TCP.
5. **Save to device** and verify in configurator read-back.

### Option B — SMS / GPRS command (parameter 113)

Set parameter **113** to **0** (Codec 8):

- Parameter: `113`
- Type: Uint8
- Value: `0` = Codec 8, `1` = Codec 8 Extended, `2` = Codec JSON

(Use the command format from the [FMM130 SMS/GPRS command list](https://wiki.teltonika-gps.com/view/FMM130_SMS/GPRS_command_list) for your firmware version.)

### Option C — FOTA Web / Configurator profile

When building a fleet profile, lock **Data Protocol = Codec 8** so new devices cannot revert to 8E on firmware update without review.

### Commissioning verification

1. Device connects to TCP **5000** → server log: `[TCP] IMEI registered: …`
2. Inspect **first AVL packet** codec byte (offset 8 after 4-byte preamble + 4-byte length): must be **`0x08`**.
3. `curl http://127.0.0.1:3000/vehicle?imei=<IMEI>` returns **200** with lat/lng.

If codec byte is **`0x8E`**, server will not populate GPS — re-check parameter 113.

---

## 5. Risk matrix

| Scenario | Result |
|----------|--------|
| FMM130 default (8E) → Kodikz backend | **FAIL** — no GPS in API |
| FMM130 set to Codec 8 | **PASS** — expected production path |
| FMM130 set to Codec JSON | **FAIL** — not TCP AVL |
| Codec 7 legacy device | **Possible PASS** — supported by parser, not tested by Kodikz |
| `SIMULATION_MODE=true` | **PASS** — bypasses TCP; HTTP only |

---

## 6. Recommended follow-ups (not in scope of this report)

| Item | Purpose |
|------|---------|
| Startup `console.warn` | Alert operators at deploy time |
| `GET /health` → `warnings[]` | Surface protocol mismatch to monitoring |
| Integration test with `0x08` sample packet | Regression guard |
| Future: Codec 8 Extended decoder | Align with Teltonika default and modern AVL IDs |

---

## 7. References

- [Teltonika Codec wiki](https://wiki.teltonika-gps.com/view/Codec)
- [Codec 8 vs 8 Extended FAQ](https://wiki.teltonika-gps.com/view/Which_data_protocol_to_choose_Codec_8_or_Codec_8_Extended)
- [FMM130 Parameter list (ID 113)](https://wiki.teltonika-gps.com/view/FMM130_Parameter_list)
- Kodikz: `backend/parser.js`, `backend/node_modules/teltonika-parser/index.js`
