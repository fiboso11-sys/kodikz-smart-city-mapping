# Phase 3 — Failure Recovery

| Failure | Behavior |
|---------|----------|
| Storage down | 503 STORAGE_UNAVAILABLE; survey continues |
| Invalid transition | 409 |
| Auth failure | 401/403 |
| Outbox publish fail | retry / FAILED |
| Offline | queue + flush on reconnect |
| Pilot missing PG | startup ConfigError |

Full chaos (container/DB restart): MANUAL on pilot.
