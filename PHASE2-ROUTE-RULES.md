# Phase 2.1 — Route Corridor & Segment Rules

**Date:** 2026-07-15

---

## Corridor Rules

### Distance Zones

| Zone | Distance from route center | Classification |
|------|---------------------------|----------------|
| ON_ROUTE | 0 – 15 metres | Normal operation |
| WARNING | 15 – 30 metres | Driver warned |
| OFF_ROUTE | > 30 metres | Deviation detected |

### GPS Quality Gate

| Metric | Threshold | Action |
|--------|-----------|--------|
| GPS Accuracy | > 40 metres | State → GPS_UNRELIABLE; no violations |

### Distance Calculation

- Uses perpendicular (cross-track) distance to nearest route segment
- Haversine formula for WGS84 accuracy
- Computed against entire polyline; returns nearest segment index
- Route geometry supports both `LineString` and `MultiLineString`

---

## Segment Rules

### Segmentation

- Route polyline is split into segments of **25 metres** (configurable)
- Each segment has: start coord, end coord, length, bearing
- Segments are numbered sequentially (0-indexed)

### Segment Completion Criteria

ALL of the following must be true for a segment to be marked complete:

| Rule | Condition |
|------|-----------|
| Within corridor | Distance from route ≤ 15m |
| Valid GPS | Accuracy ≤ 40m |
| Correct direction | Heading difference ≤ 45° |
| Minimum samples | At least 2 GPS samples in segment |
| Speed minimum | Speed ≥ 3 km/h |
| Speed maximum | Speed ≤ 60 km/h |

### Why Speed Limits?

- **Min 3 km/h**: Excludes stationary GPS drift from counting as coverage
- **Max 60 km/h**: Excludes highway traversal that isn't real survey work

---

## Heading Rules

### Direction Classification

| Difference (vehicle vs route) | Classification |
|-------------------------------|----------------|
| 0° – 45° | CORRECT |
| 45° – 90° | MONITOR |
| > 90° | WRONG_DIRECTION |

### Wrong Direction Detection

- Requires sustained > 90° difference for **5 seconds**
- Ignored when speed < 8 km/h (vehicle turning around, parking)
- Heading difference uses minimum angular distance (0–180°)

### Route Heading Source

- Computed from the bearing of the nearest route segment (start → end)
- Updates as the vehicle progresses along the route

---

## Completion Rules

### Percentage Calculation

```
completion_pct = (completed_segments_length / total_route_length) × 100
```

### Status Thresholds

| Percentage | Status |
|-----------|--------|
| 0% | NOT_STARTED |
| 1% – 89% | IN_PROGRESS |
| 90% – 97% | NEARLY_COMPLETE |
| 98% – 99% | COMPLETION_CANDIDATE |
| 100% | COMPLETED |

### Completion is Monotonic

- Segments never "un-complete" once marked done
- If a vehicle revisits a completed segment, it does not count again
- Completion percentage only increases

---

## Configuration Reference

All thresholds are defined in `src/engines/sge/config.ts` and can be overridden at runtime:

```typescript
{
  corridor: {
    onRouteMetres: 15,
    warningMetres: 30,
    offRouteMetres: 30,
    gpsUnreliableAccuracyMetres: 40,
  },
  heading: {
    correctDeg: 45,
    monitorDeg: 90,
    wrongDirectionDeg: 90,
    wrongDirectionDurationMs: 5000,
    ignoreSpeedKmh: 8,
  },
  segment: {
    defaultLengthMetres: 25,
    minGpsSamples: 2,
    minSpeedKmh: 3,
    maxSpeedKmh: 60,
  },
  completion: {
    notStartedPct: 0,
    inProgressMaxPct: 89,
    nearlyCompleteMaxPct: 97,
    completionCandidatePct: 98,
    completedPct: 100,
  },
}
```
