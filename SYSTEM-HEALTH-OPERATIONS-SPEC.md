# System Health — Operations Spec

## Location

- UI: Settings → System Health (`/settings/system-health`)
- API: `GET /api/system-health`

## Displayed (safe)

Product, version, release, tag, commit (short), build time, environment, overall status, application, database, GPS backend, Socket.IO, object storage, geo upload module, migration version, server time, uptime seconds.

## States

`HEALTHY` · `DEGRADED` · `UNAVAILABLE` · `UNKNOWN` · `NOT CONFIGURED`

## Distinctions

| Situation | Presentation |
|-----------|--------------|
| App process up, external GPS down | Overall DEGRADED; GPS UNAVAILABLE (external) |
| PostgreSQL down in pilot | Overall UNAVAILABLE |
| Object storage unset in local | NOT CONFIGURED (not a failure) |
| WS handshake not proven | Message notes HTTP host check only |

## Never shown

Passwords, tokens, connection strings, private keys, secret env values, customer PII, full stack traces, filesystem DB paths.

## Fabrication

Checks are live probes. Failures report UNAVAILABLE/DEGRADED — success is never invented.
