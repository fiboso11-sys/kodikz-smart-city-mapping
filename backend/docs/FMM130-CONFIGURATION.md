# Kodikz GPS Backend — FMM130 Compatibility Requirement

**Required before connecting FMM130 devices to the Kodikz VPS.**

---

## Configure the device (Codec 8 only)

1. Open **Teltonika Configurator**
2. Navigate to: **System → Data Protocol**
3. Change: **Parameter 113 = 0**
4. Select: **Codec 8**

### Do NOT use

- Codec 8 Extended (8E)
- Codec JSON

---

## Backend compatibility

| Status | Protocol |
|--------|----------|
| Supported | Codec 8 (`0x08`) |
| Not supported | Codec 8 Extended (8E / `0x8E`) |
| Not supported | Codec JSON |

> FMM130 **factory default** is Codec 8 Extended (`113 = 1`). Devices must be reconfigured or they will connect but **no GPS will appear** in `GET /vehicle`.

See also: [TELTONIKA-COMPATIBILITY.md](./TELTONIKA-COMPATIBILITY.md)

---

## Server settings (after saving device config)

| Setting | Value |
|---------|--------|
| Server IP | VPS public IP (or hostname pointing to VPS) |
| TCP port | **5000** |
| Protocol | **TCP** |
| TLS | Off |

---

## Commissioning verification

1. Device connects → server log: `[TCP] IMEI registered: <imei>`
2. Inspect **first AVL packet** — codec ID byte must be **`0x08`**
   - If **`0x8E`** → device still on Codec 8 Extended; fix Parameter 113
3. HTTP check:
   ```bash
   curl -s "http://127.0.0.1:3000/vehicle?imei=<IMEI>" | jq
   ```
   Expect `200 OK` with `latitude`, `longitude`, `speed`.

---

## SMS / parameter reference

| Parameter ID | Name | Required value |
|--------------|------|----------------|
| **113** | Data Protocol | **0** = Codec 8 |

Values: `0` Codec 8 · `1` Codec 8 Extended · `2` Codec JSON
