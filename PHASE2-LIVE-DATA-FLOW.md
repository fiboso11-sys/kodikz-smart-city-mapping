# Phase 2.1b — Live Data Flow

**Date:** 2026-07-16

---

## End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. GPS DEVICE (Teltonika)                                       │
│    Sends: lat, lon, speed, heading, satellites, timestamp        │
│    Frequency: Every 1-5 seconds                                 │
└───────────────────────────────┬─────────────────────────────────┘
                                ↓
┌───────────────────────────────┴─────────────────────────────────┐
│ 2. BACKEND (api-kodikz.giantphoenixllc.com)                     │
│    Receives GPS, stores, broadcasts via Socket.IO                │
│    Events: "location_update" per vehicle                         │
└───────────────────────────────┬─────────────────────────────────┘
                                ↓
┌───────────────────────────────┴─────────────────────────────────┐
│ 3. FRONTEND — LiveGpsProvider (live-gps.tsx)                     │
│    Socket.IO client receives "location_update"                   │
│    HTTP polling every 5s for fleet positions                     │
│    Updates: gisStore.setLivePosition() / setLiveBatch()          │
└───────────────────────────────┬─────────────────────────────────┘
                                ↓
┌───────────────────────────────┴─────────────────────────────────┐
│ 4. GIS STORE (Zustand)                                          │
│    liveByImei: Record<string, VehicleLivePosition>              │
│    Updated reactively — triggers re-renders                      │
└───────────────────────────────┬─────────────────────────────────┘
                                ↓
┌───────────────────────────────┴─────────────────────────────────┐
│ 5. useSgeFeed HOOK (use-sge-feed.ts)                            │
│    Watches liveByImei for the assigned vehicle's IMEI            │
│    Deduplicates by timestamp                                     │
│    Constructs GpsPoint: { lat, lon, accuracy, speed, heading }   │
│    Calls: sgeStore.feedGps(gpsPoint)                            │
└───────────────────────────────┬─────────────────────────────────┘
                                ↓
┌───────────────────────────────┴─────────────────────────────────┐
│ 6. SGE ENGINE (processGpsTick)                                  │
│                                                                  │
│    Pipeline:                                                     │
│    a. Corridor Engine → distanceFromRoute, nearestSegment        │
│    b. Heading Engine → headingStatus, wrongDirection             │
│    c. Segment Engine → segment completion tracking               │
│    d. Completion Engine → completionPct, completionStatus        │
│    e. State Machine → routeState (with hysteresis)               │
│    f. Voice Engine → voiceEvents (if state changed)              │
│                                                                  │
│    Output: SgeSnapshot (immutable decision object)               │
└───────────────────────────────┬─────────────────────────────────┘
                                ↓
┌───────────────────────────────┴─────────────────────────────────┐
│ 7. SGE STORE (Zustand)                                          │
│    Stores: latestSnapshot, routeState, completionPct,            │
│            headingStatus, distanceFromRoute, voiceLog, etc.      │
│    Reactive: triggers component re-renders                       │
└───────────────────────────┬───────────────────┬─────────────────┘
                            ↓                   ↓
┌───────────────────────────┴───┐  ┌────────────┴────────────────┐
│ 8a. DRIVER UI                  │  │ 8b. SUPERVISOR UI            │
│                                │  │                              │
│ • SurveyStatusPanel            │  │ • /survey-guidance page      │
│   (state, %, deviation, dir)   │  │ • SupervisorDashboard table  │
│ • BlockageReporter             │  │ • KPI cards                  │
│   (report road issues)         │  │ • Blockage reports list      │
│ • VoiceLog                     │  │ • Voice event log            │
│   (recent audio events)        │  │                              │
│ • Voice Output                 │  │                              │
│   (Web Speech API speaks)      │  │                              │
└────────────────────────────────┘  └──────────────────────────────┘
```

---

## Key Properties

| Property | Value |
|----------|-------|
| **Latency** | <100ms from store update to UI render |
| **Frequency** | ~1 Hz (1 decision per GPS tick) |
| **Connection** | Single Socket.IO + HTTP polling fallback |
| **State management** | Zustand (no prop drilling) |
| **Map integration** | GeoJSON source updates (no remount) |
| **Voice** | Web Speech API (client-side, no server) |
| **Deduplication** | Timestamp-based in useSgeFeed |

---

## No-Reload Guarantee

The following NEVER causes a page reload or component remount:
- GPS position update
- SGE state transition
- Completion percentage change
- Voice event trigger
- Blockage report submission
- Route assignment start/cancel

All updates flow through Zustand stores → React re-render cycle → DOM patch.
