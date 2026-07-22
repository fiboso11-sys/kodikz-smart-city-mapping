# Phase 2.3 — Offline Sync

## Queue

`OfflineQueue` (`src/platform/sge/offline/offline-queue.ts`) persists to localStorage and flushes on `online`.

### Op types

- `BLOCKAGE_REPORT`
- `ASSIGNMENT_UPDATE`
- `ALERT_ACK`
- `PROGRESS_SYNC`
- `DECISION_SYNC`
- `VOICE_LOG`
- `DRIVER_ACTION`
- `TIMELINE_EVENT`
- `PHOTO_UPLOAD`

## Conflict handling

- Coalesce latest `ASSIGNMENT_UPDATE` / `PROGRESS_SYNC` per assignment
- Coalesce latest `DECISION_SYNC` per vehicle
- FIFO flush; drop after 8 failed attempts (dead-letter)
- Local SGE sessions continue without internet

## Sync target

Queued items POST to production survey APIs via `surveyApi`.
