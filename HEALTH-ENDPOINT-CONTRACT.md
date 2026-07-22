# Health Endpoint Contract — `/api/system-health`

## Purpose

Machine-readable operational health for operators and support tooling.

## Method

`GET /api/system-health`

## HTTP status

| Condition | HTTP |
|-----------|------|
| Application responding; components healthy or only optional integrations degraded/not configured | `200` |
| Critical local dependency unavailable (e.g. required database down) | `503` |

Liveness for Docker continues to use `/api/health` (always lean). Readiness uses `/api/readiness`.

## Response shape (summary)

```json
{
  "status": "healthy | degraded | unavailable",
  "product": "...",
  "version": "1.0.0",
  "release": "RC1",
  "gitTag": "v1.0.0-rc1",
  "commitSha": "...",
  "buildTime": "...",
  "environment": "...",
  "uptimeSeconds": 0,
  "migrationVersion": "1",
  "components": {
    "application": { "status": "healthy", "configured": true, "message": "...", "lastCheckedAt": "...", "responseTimeMs": 0 },
    "database": {},
    "socketIo": {},
    "gpsBackend": {},
    "objectStorage": {}
  },
  "timestamp": "..."
}
```

Component fields are limited to: `status`, `responseTimeMs`, `lastCheckedAt`, `message`, `configured`.

## Secrets

URLs with embedded credentials are stripped. Exceptions and connection strings are never returned. Legacy `modules` block no longer includes DB filesystem paths.

## Related

- `GET /api/release-identity` — identity only
- `GET /api/health` — probe-friendly liveness
- `GET /api/readiness` — dependency readiness
