# Phase 2.1c — Assignment Manager

**Branch:** `phase2/dubai-giscd-enhancements`  
**Date:** 2026-07-16

---

## Purpose

Replace UI-only route assignment with a production **Assignment Manager** that:

- Survives page refresh
- Survives reconnect
- Is the **only** provider of active survey context

## Location

`src/platform/sge/assignment/assignment-manager.ts`

## Data Model

| Field | Type |
|-------|------|
| id | string |
| tenantId | string |
| vehicleId | string |
| driverId | string \| null |
| routeId | string |
| routeName | string |
| permitId | string \| null |
| surveyType | STREET_MAPPING \| AREA_SURVEY \| REVISIT \| OTHER |
| priority | LOW \| NORMAL \| HIGH \| CRITICAL |
| plannedStart / plannedEnd | number \| null |
| actualStart / actualEnd | number \| null |
| status | AssignmentStatus |
| createdBy / approvedBy | string |
| createdAt / updatedAt | number |
| geometry | LineString \| MultiLineString |

## States

```
DRAFT → ASSIGNED → ACTIVE ⇄ PAUSED → COMPLETED
                 ↘ CANCELLED
```

## API

| Method | Effect |
|--------|--------|
| `create()` | DRAFT |
| `assignVehicle()` | ASSIGNED |
| `assignDriver()` | ASSIGNED |
| `startSurvey()` | ACTIVE + SURVEY_STARTED event |
| `pauseSurvey()` | PAUSED |
| `resumeSurvey()` | ACTIVE |
| `completeSurvey()` | COMPLETED |
| `cancelSurvey()` | CANCELLED |
| `restoreActiveAssignments()` | Re-emit ASSIGNMENT_RESTORED after refresh |
| `getActiveForVehicle()` | Sole lookup for active survey context |

## Persistence

Assignments stored in `localStorage` key `kodikz.sge.assignments.v1`.

## UI Integration

`RouteAssigner` → `useRouteAssignmentStore.createAndStart()` → Assignment Manager → Session Manager.
