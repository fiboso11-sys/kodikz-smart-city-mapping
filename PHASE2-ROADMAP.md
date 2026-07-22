# Phase 2 Roadmap — Module Details

**Project:** Dubai Street Mapping Monitoring System  
**Phase:** 2 — GISCD Enhancements  
**Date:** 2026-07-15

---

## Module 1: Route Deviation Detection

**Purpose:** Detect when a vehicle deviates from its assigned survey route and flag it in real-time.

**Business Value:** Ensures mapping vehicles follow prescribed routes, improving survey coverage and reducing wasted trips.

**Frontend Changes:**
- Deviation indicator on vehicle marker (amber/red ring pulse)
- Deviation alert banner in dashboard
- Deviation distance display in vehicle detail panel
- Route corridor visualization (buffered polyline)

**Backend Impact:**
- New API endpoint: `GET /api/violations/deviations`
- Corridor distance calculation (Turf.js or server-side PostGIS)

**Database Impact:**
- New `deviations` table or extend `violations` table with `type = "route_deviation"`

**Estimated Complexity:** High (geometry computation, real-time detection)

**Dependencies:** Phase 1 routes, live GPS positions, vehicle-route assignments

**Feature Branch:** `feature/phase2-route-deviation`

---

## Module 2: Real-Time Driver Guidance

**Purpose:** Provide turn-by-turn navigation guidance to drivers following survey routes.

**Business Value:** Reduces driver training time, ensures correct route following, minimizes human error.

**Frontend Changes:**
- Driver guidance panel (next turn, distance remaining)
- Route progress bar
- Mobile-optimized driver view (`/driver-guidance`)
- Audio/vibration cues for upcoming turns

**Backend Impact:**
- Route geometry segmentation API
- Turn instruction generation from route geometry

**Database Impact:** None (computed from existing route geometry)

**Estimated Complexity:** High (mobile UX, real-time updates, turn-by-turn logic)

**Dependencies:** Phase 1 routes, GPS positions, Socket.IO

**Feature Branch:** `feature/phase2-driver-guidance`

---

## Module 3: Survey Completion Analytics

**Purpose:** Track what percentage of each route has been surveyed and identify gaps.

**Business Value:** Provides management visibility into survey progress and identifies areas needing resurvey.

**Frontend Changes:**
- Completion percentage per route in route list
- Route coverage visualization (colored segments: surveyed vs unsurveyed)
- Daily/weekly progress charts (Recharts)
- Coverage summary in KPI grid

**Backend Impact:**
- Route coverage calculation endpoint: `GET /api/routes/[id]/coverage`
- GPS history matching to route segments

**Database Impact:**
- Optional: `route_coverage` materialized view for performance

**Estimated Complexity:** Medium (geometry matching, progress tracking)

**Dependencies:** GPS history, route geometry, vehicle assignments

**Feature Branch:** `feature/phase2-survey-analytics`

---

## Module 4: Violation Detection

**Purpose:** Automatically detect operational violations (speeding, unauthorized stops, zone breaches).

**Business Value:** Improves fleet compliance, reduces manual monitoring effort, provides audit evidence.

**Frontend Changes:**
- Violations table with filters (type, severity, vehicle, date range)
- Violation markers on map (red alert icons)
- Violation detail drawer
- Real-time violation toast notifications

**Backend Impact:**
- Violation detection engine (speed thresholds, zone boundaries, stop duration)
- `POST /api/violations` for recording
- `GET /api/violations` with pagination and filters

**Database Impact:**
- Extend violations table with `type`, `severity`, `metadata` fields

**Estimated Complexity:** High (rule engine, real-time detection, multiple violation types)

**Dependencies:** Route deviation (Module 1), GPS positions, zone definitions

**Feature Branch:** `feature/phase2-violation-detection`

---

## Module 5: Historical Playback

**Purpose:** Replay a vehicle's historical path with time controls (play, pause, speed, scrub).

**Business Value:** Enables post-incident investigation, route quality review, and training.

**Frontend Changes:**
- Playback page with timeline scrubber
- Play/pause/speed controls
- Vehicle ghost marker following historical path
- Trail line animation
- Timestamp display synced to playback position

**Backend Impact:**
- Extend `GET /api/gps/history/[imei]` with date range and higher limits
- Ensure efficient pagination for large histories

**Database Impact:** None (uses existing GPS history)

**Estimated Complexity:** Medium (animation logic, timeline controls, data pagination)

**Dependencies:** GPS history API, MapLibre animations

**Feature Branch:** `feature/phase2-playback`

---

## Module 6: Coverage Heatmap

**Purpose:** Visualize survey density as a heatmap layer showing frequently vs rarely covered areas.

**Business Value:** Identifies coverage gaps and over-surveyed areas, enabling resource optimization.

**Frontend Changes:**
- Heatmap toggle in map layers
- MapLibre heatmap layer (density-based)
- Date range filter for heatmap data
- Legend showing density scale

**Backend Impact:**
- Aggregated GPS point endpoint: `GET /api/analytics/coverage-density`
- Grid-based aggregation for performance

**Database Impact:**
- Optional: pre-computed density grid table for large datasets

**Estimated Complexity:** Medium (MapLibre heatmap layer, data aggregation)

**Dependencies:** GPS history, MapLibre heatmap support

**Feature Branch:** `feature/phase2-coverage-heatmap`

---

## Module 7: Alert Center

**Purpose:** Centralized notification center for all system events (violations, deviations, system health).

**Business Value:** Single point of attention for operators, reduces missed events, enables prioritization.

**Frontend Changes:**
- Alert bell icon with unread count in header
- Alert drawer/panel with categorized notifications
- Read/dismiss functionality
- Alert severity levels (info, warning, critical)
- Sound/vibration for critical alerts

**Backend Impact:**
- `GET /api/alerts` with pagination
- `PATCH /api/alerts/[id]` for read/dismiss
- Alert generation from violation/deviation events

**Database Impact:**
- New `alerts` table (id, type, severity, message, vehicleId, read, createdAt)

**Estimated Complexity:** Medium (notification UX, real-time delivery, persistence)

**Dependencies:** Violations (Module 4), Route Deviation (Module 1)

**Feature Branch:** `feature/phase2-alert-center`

---

## Module 8: Advanced Reporting

**Purpose:** Generate PDF/CSV reports for management (daily fleet summary, compliance, coverage).

**Business Value:** Provides documentation for Dubai Municipality oversight, audit compliance, and KPI tracking.

**Frontend Changes:**
- Reports page with report type selection
- Date range picker
- Generate/download buttons
- Report preview
- Scheduled report configuration (optional)

**Backend Impact:**
- Report generation endpoint: `POST /api/reports/generate`
- PDF generation (e.g., @react-pdf/renderer or server-side)
- CSV export utility

**Database Impact:** None (aggregates existing data)

**Estimated Complexity:** Medium (PDF generation, data aggregation, export formats)

**Dependencies:** All data modules (vehicles, routes, violations, coverage)

**Feature Branch:** `feature/phase2-reporting`

---

## Module 9: Audit Trail

**Purpose:** Log all system actions (user logins, vehicle edits, permit changes) for accountability.

**Business Value:** Required for government compliance, provides accountability, enables forensic review.

**Frontend Changes:**
- Audit trail page with filterable log table
- Action detail drawer
- User activity timeline
- Export to CSV

**Backend Impact:**
- Middleware to capture API mutations
- `GET /api/audit` with filters (user, action, entity, date range)
- Audit log recording on all write operations

**Database Impact:**
- New `audit_log` table (id, userId, action, entity, entityId, metadata, timestamp)

**Estimated Complexity:** Low (CRUD + middleware pattern)

**Dependencies:** None (standalone module)

**Feature Branch:** `feature/phase2-audit-trail`

---

## Module 10: Performance Optimisation

**Purpose:** Optimize rendering, data loading, and memory usage for production scale.

**Business Value:** Ensures smooth operation with 500+ vehicles, reduces server costs, improves user experience.

**Frontend Changes:**
- Virtual scrolling for large vehicle lists
- Map marker clustering optimization
- React.memo on heavy components
- Bundle size reduction (code splitting)
- Service Worker for offline resilience

**Backend Impact:**
- Query optimization
- Response compression
- Cache headers

**Database Impact:**
- Index optimization
- Query plan review

**Estimated Complexity:** Low (profiling-driven, incremental improvements)

**Dependencies:** All modules complete (optimize holistically)

**Feature Branch:** `feature/phase2-performance`
