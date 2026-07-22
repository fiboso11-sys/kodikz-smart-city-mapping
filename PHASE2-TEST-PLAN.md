# Phase 2.1 — Test Plan

**Date:** 2026-07-15

---

## Automated Validation Suite

**Location:** `src/engines/sge/__tests__/sge-validation.ts`  
**Run command:** `npx tsx src/engines/sge/__tests__/sge-validation.ts`

---

## Test Scenarios

### Scenario 1: Normal Route Following

| Step | Input | Expected |
|------|-------|----------|
| Start on route | GPS at route start, speed 30, heading aligned | State → ON_ROUTE |
| Move along route | Multiple GPS ticks along route | Completion increases |
| Stay on route | All ticks within 15m corridor | State remains ON_ROUTE |
| Heading correct | Vehicle heading matches route bearing | HeadingStatus = CORRECT |

### Scenario 2: Intentional Deviation

| Step | Input | Expected |
|------|-------|----------|
| Start on route | GPS on route | State = ON_ROUTE |
| Move to warning zone | GPS 20m from route | State = WARNING |
| Move further off | GPS 50m from route + 3s | State = OFF_ROUTE |
| Voice triggered | — | LEAVING_ROUTE event emitted |

### Scenario 3: Wrong Direction

| Step | Input | Expected |
|------|-------|----------|
| Correct heading | Heading aligned with route | HeadingStatus = CORRECT |
| Turn around | Heading 180° from route, speed > 8 km/h | HeadingStatus = WRONG_DIRECTION |
| Sustain 5 seconds | 5+ seconds at wrong heading | wrongDirection = true |
| Low speed ignore | Speed < 8 km/h, any heading | HeadingStatus = CORRECT (ignored) |

### Scenario 4: GPS Loss

| Step | Input | Expected |
|------|-------|----------|
| Good GPS | Accuracy 5m | Normal operation |
| GPS degrades | Accuracy 50m | State = GPS_UNRELIABLE |
| No violations | — | No segment completions |
| GPS recovers | Accuracy 5m | State returns to ON_ROUTE/WARNING |

### Scenario 5: Road Closure (Blockage)

| Step | Input | Expected |
|------|-------|----------|
| Report blockage | reason=ROAD_CLOSED, lat, lon | Report created with valid ID |
| Stored | — | Added to context reports[] |
| Supervisor notified | — | Added to pendingNotifications[] |
| Acknowledge | — | pendingNotifications cleared |

### Scenario 6: Route Completion

| Step | Input | Expected |
|------|-------|----------|
| Traverse route | GPS along all segments (2+ samples each) | Completion increases |
| 100% reached | All segments completed | State = COMPLETED |
| Voice event | — | SURVEY_COMPLETE emitted |
| State locked | Further GPS ticks | State remains COMPLETED |

### Scenario 7: Return to Route

| Step | Input | Expected |
|------|-------|----------|
| Deviate off route | GPS > 30m | State = OFF_ROUTE |
| Move back | GPS ≤ 30m | State = RETURNING |
| Sustained return | GPS ≤ 15m for 3s | State = ON_ROUTE |
| Voice event | — | BACK_ON_ROUTE emitted |

### Scenario 8: Pause/Resume

| Step | Input | Expected |
|------|-------|----------|
| Active session | State = ON_ROUTE | Normal |
| Pause | User action | State = PAUSED |
| GPS updates | Ticks continue | State remains PAUSED |
| Resume | User action | State returns to ON_ROUTE/WARNING |

---

## Test Results (Latest Run)

```
╔══════════════════════════════════════════════╗
║  Survey Guidance Engine — Validation Suite   ║
╚══════════════════════════════════════════════╝

Results: 23 passed, 0 failed, 23 total
✅ ALL TESTS PASSED
```

---

## Manual Testing Checklist

### Pre-requisites
- [ ] Dev server running (`pnpm dev`)
- [ ] Live GPS data available (real or simulated)
- [ ] Route assignment configured for test vehicle

### Functional Tests
- [ ] Start survey session — state shows NOT_STARTED then ON_ROUTE
- [ ] Drive along route — completion percentage increases smoothly
- [ ] Drive off route — warning appears within 3s, voice at 8s
- [ ] Return to route — state transitions through RETURNING to ON_ROUTE
- [ ] Wrong direction — detected after 5s, voice alert plays
- [ ] Low speed (<8 km/h) — heading ignored, no wrong direction alert
- [ ] GPS degradation — state shows GPS_UNRELIABLE
- [ ] Report blockage — form submits, supervisor notification queued
- [ ] Complete route — COMPLETED state, voice "Good job!"
- [ ] Pause/Resume — state management works correctly

### Stability Tests
- [ ] No flickering between states (hysteresis works)
- [ ] No duplicate voice events (cooldown works)
- [ ] State machine doesn't crash on edge cases
- [ ] GPS loss recovery is smooth
- [ ] Completion never decreases
- [ ] Memory stable over 30+ minutes

### Integration Tests
- [ ] SGE receives GPS from live feed correctly
- [ ] Zustand store updates reactively
- [ ] UI components render without errors
- [ ] No console warnings
- [ ] Build passes (`pnpm build`)
- [ ] Type-check passes (`pnpm type-check`)

---

## Regression Checks (Phase 1)

After SGE implementation, verify:
- [ ] Dashboard loads normally
- [ ] Live Monitoring still works
- [ ] Vehicle markers still show car icons
- [ ] Socket.IO connection stable
- [ ] No map blinking
- [ ] Sidebar navigation works
- [ ] All pages return 200 OK
