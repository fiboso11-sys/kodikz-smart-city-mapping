# Phase 2.1c — Offline Strategy

**Date:** 2026-07-16

---

## Purpose

Driver guidance must continue without internet.

## Components

### 1. Local SGE Engine

Corridor / heading / segment / completion / state machine run **entirely client-side**.  
GPS from last known Socket.IO / device can still drive decisions offline if packets arrive locally.

### 2. Offline Queue

`src/platform/sge/offline/offline-queue.ts`

Queues mutations while offline:

- BLOCKAGE_REPORT
- ASSIGNMENT_UPDATE
- ALERT_ACK
- PROGRESS_SYNC
- VOICE_LOG

Auto-flushes on `window.online`.

### 3. Persisted Assignments + Progress

Route geometry and segment completion are local — survey continues after refresh even offline.

### 4. Road Resolver Cache

Cached road names avoid network for reverse geocoding within 40m / 30min.

## Sync Handler

Default handler marks items synced (frontend-only until backend API exists).  
Replace via `offlineQueue.setSyncHandler(fn)`.

## Supervisor Visibility

`/survey-guidance` shows pending offline queue count when > 0.
