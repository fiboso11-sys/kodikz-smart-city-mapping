# Phase 2.1 — Survey Guidance Engine Architecture

**Date:** 2026-07-15  
**Branch:** `phase2/dubai-giscd-enhancements`

---

## System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                      GPS Device (Teltonika)                │
└──────────────────────────────┬────────────────────────────┘
                               ↓
┌──────────────────────────────┴────────────────────────────┐
│                     Backend (GPS API)                      │
│         Socket.IO events + HTTP polling endpoints          │
└──────────────────────────────┬────────────────────────────┘
                               ↓
┌──────────────────────────────┴────────────────────────────┐
│                     Frontend (Next.js)                     │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Live GPS Provider (Socket.IO)           │  │
│  │                      ↓                              │  │
│  │           GIS Store (liveByImei)                     │  │
│  │                      ↓                              │  │
│  │           useSgeFeed Hook (bridge)                   │  │
│  │                      ↓                              │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │      SURVEY GUIDANCE ENGINE (SGE)            │   │  │
│  │  │                                              │   │  │
│  │  │  ┌────────────┐  ┌───────────────────────┐  │   │  │
│  │  │  │  Corridor   │  │    State Machine      │  │   │  │
│  │  │  │  Engine     │→ │    (hysteresis)       │  │   │  │
│  │  │  └────────────┘  └───────────────────────┘  │   │  │
│  │  │                                              │   │  │
│  │  │  ┌────────────┐  ┌───────────────────────┐  │   │  │
│  │  │  │  Heading    │  │    Segment Engine     │  │   │  │
│  │  │  │  Engine     │  │    (25m chunks)       │  │   │  │
│  │  │  └────────────┘  └───────────────────────┘  │   │  │
│  │  │                                              │   │  │
│  │  │  ┌────────────┐  ┌───────────────────────┐  │   │  │
│  │  │  │ Completion  │  │    Voice Engine       │  │   │  │
│  │  │  │  Engine     │  │    (Web Speech API)   │  │   │  │
│  │  │  └────────────┘  └───────────────────────┘  │   │  │
│  │  │                                              │   │  │
│  │  │  ┌────────────────────────────────────────┐  │   │  │
│  │  │  │        Blockage Engine                  │  │   │  │
│  │  │  └────────────────────────────────────────┘  │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                      ↓                              │  │
│  │           SGE Store (Zustand)                        │  │
│  │                      ↓                              │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │         UI Components                        │   │  │
│  │  │  • SurveyStatusPanel (driver)                │   │  │
│  │  │  • SupervisorDashboard (supervisor)          │   │  │
│  │  │  • BlockageReporter (driver)                 │   │  │
│  │  │  • VoiceLog (driver/supervisor)              │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

## Data Flow (Per GPS Tick)

1. **GPS Device** → Backend: Raw position (lat, lon, speed, heading, accuracy)
2. **Backend** → Frontend: Socket.IO `position` event or HTTP poll
3. **GIS Store**: Updates `liveByImei[imei]`
4. **useSgeFeed**: Detects new position, constructs `GpsPoint`, calls `feedGps()`
5. **SGE Pipeline**:
   - Corridor Engine → distance from route, nearest segment
   - Heading Engine → direction correctness
   - Segment Engine → segment completion tracking
   - Completion Engine → overall percentage
   - State Machine → route state with hysteresis
   - Voice Engine → audio cues if state transition
6. **SGE Store**: Updates reactive state
7. **UI Components**: Re-render with new values

## File Structure

```
src/engines/sge/
├── index.ts                  Public API barrel
├── config.ts                 Configurable thresholds
├── types.ts                  Type definitions
├── geo-math.ts               Geodetic calculations
├── state-machine.ts          Hysteresis state transitions
├── corridor-engine.ts        Distance-from-route computation
├── heading-engine.ts         Direction validation
├── segment-engine.ts         Route segmentation & tracking
├── completion-engine.ts      Percentage calculation
├── voice-engine.ts           Audio cue management
├── blockage-engine.ts        Road blockage reporting
├── survey-guidance-engine.ts Main orchestrator
└── __tests__/
    └── sge-validation.ts     Automated test suite

src/store/
└── sge-store.ts              Zustand reactive store

src/hooks/
└── use-sge-feed.ts           GPS → SGE bridge hook

src/components/sge/
├── index.ts                  Component barrel
├── survey-status-panel.tsx   Driver status view
├── supervisor-dashboard.tsx  Supervisor table view
├── blockage-reporter.tsx     Driver blockage form
└── voice-log.tsx             Recent voice events
```

## Key Design Decisions

1. **Pure engine, no React**: The SGE core (`src/engines/sge/`) is pure TypeScript with zero React dependencies. It can run in Node.js, Web Workers, or tests.

2. **Hysteresis everywhere**: State transitions require sustained conditions (3s return, 5s wrong direction) to prevent flickering.

3. **Configurable thresholds**: All magic numbers live in `config.ts`. Future admin panel can override at runtime.

4. **Immutable updates**: All engine functions return new state objects rather than mutating in place, making them predictable and testable.

5. **Voice via Web Speech API**: Uses browser-native speech synthesis. Falls back to queued text events for custom TTS or UI display.

6. **No backend changes**: The engine is entirely client-side. It consumes existing GPS data from the live feed.
