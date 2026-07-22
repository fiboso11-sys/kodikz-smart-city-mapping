# Phase 2.1 — State Machine Specification

**Date:** 2026-07-15

---

## States

| State | Description | Entry Condition |
|-------|-------------|-----------------|
| `NOT_STARTED` | Initial state, no GPS on route yet | Default start |
| `ON_ROUTE` | Within 15m corridor, correct direction | Distance ≤ 15m sustained |
| `WARNING` | 15–30m from route center | Distance 15–30m |
| `OFF_ROUTE` | Beyond 30m from route | Distance > 30m sustained 3s |
| `RETURNING` | Moving back toward route | Was OFF_ROUTE, now ≤ 30m |
| `PAUSED` | Driver manually paused | User action |
| `COMPLETED` | Route 100% complete | Completion = 100% |
| `GPS_UNRELIABLE` | GPS accuracy > 40m | Accuracy exceeds threshold |

## Transition Diagram

```
                    ┌──────────────┐
                    │  NOT_STARTED │
                    └──────┬───────┘
                           │ distance ≤ 15m
                           ↓
          ┌───────── ON_ROUTE ←────────┐
          │                ↑            │
          │ dist 15-30m    │ sustained  │ sustained
          ↓                │ 3s ≤ 15m   │ 3s ≤ 15m
     ┌─────────┐           │            │
     │ WARNING │───────────┘       ┌────┴─────┐
     └────┬────┘                   │ RETURNING │
          │ dist > 30m + 3s        └────┬──────┘
          ↓                             ↑
     ┌──────────┐                       │
     │ OFF_ROUTE│───────────────────────┘
     └──────────┘   dist ≤ 30m

     Any state → GPS_UNRELIABLE  (accuracy > 40m)
     GPS_UNRELIABLE → ON_ROUTE/WARNING  (accuracy recovers)

     Any state → PAUSED  (manual pause)
     PAUSED → ON_ROUTE/WARNING  (manual resume)

     Any state → COMPLETED  (completion = 100%)
```

## Hysteresis Rules

| Transition | Debounce Duration | Purpose |
|------------|-------------------|---------|
| WARNING → ON_ROUTE | 3 seconds sustained within 15m | Prevent flicker at boundary |
| RETURNING → ON_ROUTE | 3 seconds sustained within 15m | Confirm stable return |
| WARNING → OFF_ROUTE | 3 seconds sustained beyond 30m | Avoid false alarms |
| Wrong direction | 5 seconds at > 90° difference | Ignore momentary turns |

## Time-Based Escalation

| Duration Off Route | Action |
|--------------------|--------|
| 3 seconds | Visual warning (UI badge) |
| 8 seconds | Voice warning (TTS) |
| 15 seconds | Supervisor alert notification |

## GPS Quality Gate

- If `accuracy > 40m` → State = `GPS_UNRELIABLE`
- No violations generated during GPS_UNRELIABLE
- No segment completions during GPS_UNRELIABLE
- System recovers automatically when accuracy improves

## Implementation Notes

- State machine is **pure**: no side effects, no timers, no DOM access
- All time tracking uses timestamps passed in via `TransitionInput`
- Caller is responsible for providing monotonically increasing timestamps
- State transitions are computed per GPS tick (~1Hz)
