# Phase 2.1c — Event Bus

**Date:** 2026-07-16

---

## Purpose

Typed pub/sub for all Survey Guidance platform events.  
Subscribers never recalculate route logic — they react to events.

## Location

`src/platform/sge/event-bus/event-bus.ts`  
Singleton: `sgeEventBus`

## Events

| Event | Typical Severity |
|-------|------------------|
| SURVEY_STARTED | INFO |
| ON_ROUTE | INFO |
| WARNING | WARNING |
| OFF_ROUTE | CRITICAL |
| RETURNING | WARNING |
| BACK_ON_ROUTE | INFO |
| WRONG_DIRECTION | CRITICAL |
| GPS_UNRELIABLE | CRITICAL |
| SEGMENT_COMPLETED | INFO |
| BLOCKAGE_REPORTED | CRITICAL |
| SURVEY_PAUSED / RESUMED | INFO |
| SURVEY_COMPLETED | INFO |
| SURVEY_CANCELLED | WARNING |
| ASSIGNMENT_CREATED / RESTORED | INFO |

## Event Shape

```typescript
{
  id, type, timestamp,
  tenantId, vehicleId, assignmentId,
  severity, payload
}
```

## Subscribers (current + future)

| Subscriber | Status |
|------------|--------|
| Alert Center | Wired |
| Driver Copilot (voice on SURVEY_STARTED) | Wired |
| Audit | Ready to subscribe |
| Playback | Ready |
| Reports | Ready |
| Notifications / Mobile | Ready |

## API

- `subscribe(type | "*", handler) → unsubscribe`
- `publish(event)`
- `getHistory(limit)`
