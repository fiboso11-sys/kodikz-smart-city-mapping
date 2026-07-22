# Phase 2.1b — Driver Workflow

**Date:** 2026-07-16

---

## Overview

The driver workflow enables a survey vehicle operator to receive real-time guidance while following an assigned route.

## Workflow Steps

### 1. Route Assignment

1. Supervisor uploads route GeoJSON via **Geo Upload** (Phase 1 feature)
2. Supervisor selects a vehicle in the **Dashboard**
3. In the Vehicle Detail Panel, supervisor selects a route from the dropdown
4. Clicks **"Start Survey"**
5. SGE session starts immediately

### 2. Active Survey

Once started, the driver sees in the Vehicle Detail Panel:

| Field | Description |
|-------|-------------|
| **Route State** | ON_ROUTE / WARNING / OFF_ROUTE / etc. |
| **Completion** | Progress bar + percentage |
| **Deviation** | Distance from route center in metres |
| **Remaining** | Distance left to complete |
| **Direction** | Heading correctness |

### 3. Voice Guidance

The browser speaks alerts automatically:
- "Warning: Leaving assigned route." (3s off)
- "Please return to the assigned route." (8s off)
- "Alert: Wrong direction detected. Please turn around." (5s wrong heading)
- "Back on route. Continue surveying." (returned to corridor)
- "Survey route completed. Good job!" (100% done)

### 4. Reporting Blockages

If the driver encounters a blocked road:
1. Tap **"Report Road Blockage"**
2. Select reason: Road Closed / Construction / Police / Accident / Unsafe / Other
3. Optionally add notes
4. Tap **Submit**
5. GPS location + timestamp recorded
6. Supervisor notified immediately

### 5. Pausing / Cancelling

- **Cancel Survey**: Ends the session, stops guidance
- Future: Pause/Resume for breaks

### 6. Completion

When 100% of segments are completed:
- State transitions to `COMPLETED`
- Voice: "Survey route completed. Good job!"
- Supervisor sees completion in their dashboard

---

## Data Flow (Driver Perspective)

```
[GPS Device updates position every ~1-5 seconds]
        ↓
[SGE processes: corridor → heading → segment → completion → state → voice]
        ↓
[UI updates in-place: status panel, progress bar, deviation indicator]
        ↓
[Voice speaks if state change occurs]
```

---

## Error States

| Condition | UI Indication | Action |
|-----------|---------------|--------|
| GPS poor (>40m accuracy) | "GPS Unreliable" badge | No violations generated |
| Off route >30m | "Off Route" + red badge | Voice warning escalation |
| Wrong direction >5s | "Wrong Direction" alert | Voice + supervisor notified |
| No GPS data | Panel shows last known state | Waiting for fix |

---

## Requirements Met

- [x] Real GPS packets update SGE
- [x] Driver sees route state in real time
- [x] Voice guidance on state changes
- [x] Blockage reporting with GPS+timestamp
- [x] No page reload needed
- [x] No map blinking
- [x] Single Socket.IO connection
