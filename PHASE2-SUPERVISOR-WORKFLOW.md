# Phase 2.1b — Supervisor Workflow

**Date:** 2026-07-16

---

## Overview

The supervisor has a dedicated page (`/survey-guidance`) providing real-time visibility into all active survey sessions.

## Supervisor Page Layout

### KPI Cards (Top)
- Active Surveys count
- Current State (of selected/active vehicle)
- Completion percentage
- Deviation distance
- Remaining distance
- Direction status

### Active Survey Detail
- Vehicle ID, Route, Speed, GPS Accuracy
- Heading, Current Segment, Last Update, Alerts Issued

### Supervisor Table (SupervisorDashboard)
| Column | Content |
|--------|---------|
| Vehicle | Plate number |
| Road | Current road (placeholder if no reverse geocoding) |
| State | Dot + state label |
| Deviation | Distance from route |
| Complete | Percentage |
| Remaining | Distance |
| Direction | OK / WRONG |
| GPS | GOOD / FAIR / POOR / UNRELIABLE |

### Blockage Reports Section
- Shows recent blockage reports from drivers
- Reason, timestamp, location

### Voice Events Log
- Chronological list of voice events triggered across sessions

---

## Supervisor Actions

### Assigning Routes
1. Navigate to **Dashboard**
2. Select a vehicle
3. In the detail panel, use the **Route Assigner** dropdown
4. Click **Start Survey**

### Monitoring Progress
1. Navigate to **Survey Guidance** page
2. View real-time status of all active surveys
3. Identify vehicles that are:
   - Off route (red dot)
   - Wrong direction (WRONG indicator)
   - GPS unreliable (orange)
   - Nearly complete (high percentage)

### Receiving Alerts
- **15-second off-route alert**: Supervisor sees state change in table
- **Blockage reports**: Appear in blockage section immediately
- **Wrong direction**: "WRONG" shows in direction column

### Cancelling a Survey
1. Go to Dashboard → select the vehicle
2. Click **Cancel Survey** in detail panel
3. Session ends, vehicle returns to normal tracking

---

## Data Updates

All updates are real-time via Zustand reactive store:
- No page reload required
- No manual refresh needed
- Updates arrive with each GPS tick (~1-5 seconds)
- Socket.IO connection provides sub-second latency

---

## Status Indicators

| State | Color | Urgency |
|-------|-------|---------|
| ON_ROUTE | Green | Normal — survey in progress |
| WARNING | Amber | Attention — vehicle drifting |
| OFF_ROUTE | Red | Action needed — vehicle deviated |
| RETURNING | Blue | Recovering — vehicle heading back |
| COMPLETED | Dark Green | Done — survey finished |
| GPS_UNRELIABLE | Orange | Technical — waiting for fix |
| PAUSED | Gray | Paused — driver on break |

---

## Requirements Met

- [x] Supervisor sees all active surveys at a glance
- [x] Real-time updates without reload
- [x] Vehicle state, deviation, completion, direction visible
- [x] GPS quality indicator
- [x] Blockage notifications
- [x] Voice event history
- [x] No impact on Phase 1 functionality
