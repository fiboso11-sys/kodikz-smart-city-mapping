# Phase 2.1c — Session Manager

**Date:** 2026-07-16

---

## Purpose

Replace single-session SGE with **multi-vehicle Session Manager**.

```
Vehicle → Assignment → SGE Session → Decision Snapshot
```

## Architecture

```
Map<vehicleId, SgeSessionState>
```

- Each vehicle owns an independent engine instance state
- Independent snapshot, route, alerts, completion
- **No shared mutable state** across vehicles

## Location

`src/platform/sge/session/session-manager.ts`

## Responsibilities

1. `startSession(assignment)` — create isolated SGE session; restore segment progress if persisted
2. `feedGps(vehicleId, gps)` — run `processGpsTick` for that vehicle only; publish Decision
3. `pause` / `resume` / `endSession` — per vehicle
4. `reportBlockage` — per vehicle + BLOCKAGE_REPORTED event
5. Persist progress to `kodikz.sge.progress.v1`

## Isolation Guarantees

| Guarantee | Implementation |
|-----------|----------------|
| No cross-vehicle leakage | Separate Map entries |
| Tenant isolation | `tenantByVehicle` map stamped on decisions |
| Assignment isolation | Decision carries `assignmentId` |
| Engine purity | Still uses `src/engines/sge` as sole calculator |

## Bootstrap

`bootstrapSgePlatform()` restores active assignments and recreates sessions after refresh.
