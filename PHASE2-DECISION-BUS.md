# Phase 2.1c — Decision Bus

**Date:** 2026-07-16

---

## Purpose

Every GPS packet produces **exactly one immutable Decision object**.

Driver UI, Supervisor UI, Playback, Reports, Analytics must all **consume** this object.  
Nothing recalculates corridor / heading / completion in the UI.

## Location

`src/platform/sge/decision-bus/decision-bus.ts`  
Types: `src/platform/sge/types/decision.ts`  
Singleton: `decisionBus`

## Decision Schema

```typescript
interface SurveyDecision {
  id, assignmentId, vehicleId, tenantId, timestamp,
  routeState, previousRouteState,
  completionPct, completionStatus,
  segmentId, nextSegmentId,
  distanceFromRoute, headingDifference, headingStatus, wrongDirection,
  gpsAccuracy, speed, heading, latitude, longitude,
  severity, voiceEvent, supervisorEvent, blockage, alerts,
  completedLengthMetres, remainingLengthMetres, totalLengthMetres,
  currentRoad
}
```

## Flow

```
GPS → SessionManager.feedGps → processGpsTick (SGE) → SurveyDecision → decisionBus.publish
                                                                         ↓
                                                              subscribers (UI / copilot)
                                                              localStorage history
```

## Persistence

Last 50 decisions per vehicle in `kodikz.sge.decisions.v1`.

## Rules

1. Decision is immutable after publish
2. One decision per GPS tick per vehicle
3. Severity derived from route state + wrong direction
4. UI may display — never recompute
