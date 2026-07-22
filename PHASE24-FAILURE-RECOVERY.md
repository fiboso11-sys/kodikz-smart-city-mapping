# Failure and Recovery

Documented code behaviors:
- Object storage down → uploads return STORAGE_UNAVAILABLE; survey continues
- Invalid assignment transitions → 409
- Auth failures → 401/403
- Outbox publish failures → retry / FAILED state
- Offline queue flush on reconnect

Full chaos matrix (Postgres/Nginx/container restarts) pending pilot execution.
