# Phase 2.1c — Persistence Layer

**Date:** 2026-07-16

---

## Purpose

Persist survey platform state so application restart recovers:

- Assignments
- Decision history
- Alerts
- Blockages (via offline queue + reports)
- Survey progress
- Voice history (reactive store + events)
- Session recovery

## Storage Adapter

`src/platform/sge/persistence/storage.ts`

- Safe `localStorage` wrapper
- No-ops on server
- Soft-fails on quota / private mode

## Keys

| Key | Content |
|-----|---------|
| `kodikz.sge.assignments.v1` | SurveyAssignment[] |
| `kodikz.sge.decisions.v1` | Record<vehicleId, SurveyDecision[]> |
| `kodikz.sge.alerts.v1` | SupervisorAlert[] |
| `kodikz.sge.progress.v1` | SessionProgressSnapshot[] |
| `kodikz.sge.offline.v1` | OfflineQueueItem[] |
| `kodikz.sge.road-cache.v1` | Road cache entries |
| `kodikz.sge.voice.v1` | Reserved |

## Recovery Flow

```
App load → hydrate() → bootstrapSgePlatform()
  → restore assignments from localStorage
  → recreate SessionManager sessions for ACTIVE/PAUSED
  → restore decision bus latest snapshots
  → restore alerts
```

## Limits

- Decisions: 50 persisted per vehicle
- Alerts: 500
- Road cache: 500 entries, 40m radius, 30min TTL

## Future

Replace localStorage with IndexedDB / backend sync without changing manager APIs.
