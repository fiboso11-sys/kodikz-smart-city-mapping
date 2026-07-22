# Phase 2 Modules — Quick Reference

**Project:** Dubai Street Mapping Monitoring System  
**Phase:** 2 — GISCD Enhancements  
**Date:** 2026-07-15

---

## Module Summary Table

| # | Module | Complexity | Sprint | Branch |
|---|--------|-----------|--------|--------|
| 1 | Route Deviation Detection | High | 1 | `feature/phase2-route-deviation` |
| 2 | Violation Detection | High | 1 | `feature/phase2-violation-detection` |
| 3 | Survey Completion Analytics | Medium | 2 | `feature/phase2-survey-analytics` |
| 4 | Historical Playback | Medium | 2 | `feature/phase2-playback` |
| 5 | Coverage Heatmap | Medium | 3 | `feature/phase2-coverage-heatmap` |
| 6 | Real-Time Driver Guidance | High | 3 | `feature/phase2-driver-guidance` |
| 7 | Alert Center | Medium | 4 | `feature/phase2-alert-center` |
| 8 | Advanced Reporting | Medium | 4 | `feature/phase2-reporting` |
| 9 | Audit Trail | Low | 5 | `feature/phase2-audit-trail` |
| 10 | Performance Optimisation | Low | 5 | `feature/phase2-performance` |

---

## Module 1: Route Deviation Detection

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Detect when a vehicle leaves its assigned route corridor |
| **Business Value** | Ensures survey compliance, reduces missed coverage |
| **Frontend** | Deviation badge on marker, alert banner, corridor polyline |
| **Backend** | Deviation detection endpoint, corridor distance calc |
| **Database** | `deviations` table (or violations subtype) |
| **Complexity** | High |
| **Dependencies** | Routes, live GPS, vehicle assignments |
| **Branch** | `feature/phase2-route-deviation` |

---

## Module 2: Violation Detection

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Detect speeding, unauthorized stops, zone breaches |
| **Business Value** | Fleet compliance, reduced manual monitoring |
| **Frontend** | Violations table, map markers, toast notifications |
| **Backend** | Rule engine, violation CRUD API |
| **Database** | Extended `violations` table |
| **Complexity** | High |
| **Dependencies** | Module 1, GPS, zone definitions |
| **Branch** | `feature/phase2-violation-detection` |

---

## Module 3: Survey Completion Analytics

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Track route coverage percentage and identify gaps |
| **Business Value** | Management visibility, resurvey planning |
| **Frontend** | Percentage badges, colored route segments, progress charts |
| **Backend** | Coverage calculation endpoint |
| **Database** | Optional materialized view |
| **Complexity** | Medium |
| **Dependencies** | GPS history, route geometry |
| **Branch** | `feature/phase2-survey-analytics` |

---

## Module 4: Historical Playback

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Replay vehicle paths with time controls |
| **Business Value** | Incident investigation, route quality review |
| **Frontend** | Playback controls, ghost marker, trail animation |
| **Backend** | Extended GPS history endpoint |
| **Database** | None (existing GPS history) |
| **Complexity** | Medium |
| **Dependencies** | GPS history API, MapLibre |
| **Branch** | `feature/phase2-playback` |

---

## Module 5: Coverage Heatmap

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Visualize survey density as a heatmap layer |
| **Business Value** | Identify coverage gaps and over-surveyed areas |
| **Frontend** | Heatmap layer toggle, date filter, legend |
| **Backend** | Density aggregation endpoint |
| **Database** | Optional pre-computed grid |
| **Complexity** | Medium |
| **Dependencies** | GPS history, MapLibre heatmap |
| **Branch** | `feature/phase2-coverage-heatmap` |

---

## Module 6: Real-Time Driver Guidance

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Turn-by-turn navigation for survey drivers |
| **Business Value** | Reduces training time, ensures correct route following |
| **Frontend** | Guidance panel, progress bar, mobile view, audio cues |
| **Backend** | Route segmentation, turn instruction generation |
| **Database** | None |
| **Complexity** | High |
| **Dependencies** | Routes, GPS, Socket.IO |
| **Branch** | `feature/phase2-driver-guidance` |

---

## Module 7: Alert Center

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Centralized notification hub for all events |
| **Business Value** | Single attention point, reduces missed events |
| **Frontend** | Bell icon, alert drawer, severity levels, sounds |
| **Backend** | Alert CRUD API, real-time delivery |
| **Database** | `alerts` table |
| **Complexity** | Medium |
| **Dependencies** | Modules 1, 4 (alert sources) |
| **Branch** | `feature/phase2-alert-center` |

---

## Module 8: Advanced Reporting

| Attribute | Detail |
|-----------|--------|
| **Purpose** | PDF/CSV reports (fleet summary, compliance, coverage) |
| **Business Value** | Audit documentation, KPI tracking |
| **Frontend** | Reports page, date picker, preview, download |
| **Backend** | Report generation engine |
| **Database** | None (aggregates existing) |
| **Complexity** | Medium |
| **Dependencies** | All data modules |
| **Branch** | `feature/phase2-reporting` |

---

## Module 9: Audit Trail

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Log all system actions for accountability |
| **Business Value** | Government compliance, forensic review |
| **Frontend** | Audit log table, filters, export |
| **Backend** | Middleware logger, audit API |
| **Database** | `audit_log` table |
| **Complexity** | Low |
| **Dependencies** | None (standalone) |
| **Branch** | `feature/phase2-audit-trail` |

---

## Module 10: Performance Optimisation

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Optimize for 500+ vehicles at production scale |
| **Business Value** | Smooth operation, reduced server costs |
| **Frontend** | Virtual scrolling, clustering, code splitting, memoization |
| **Backend** | Query optimization, compression, caching |
| **Database** | Index optimization |
| **Complexity** | Low |
| **Dependencies** | All modules complete |
| **Branch** | `feature/phase2-performance` |

---

## Dependency Graph

```
Module 9 (Audit)          ← No dependencies (can start anytime)
Module 1 (Route Deviation) ← Phase 1 routes + GPS
Module 2 (Violations)      ← Module 1
Module 3 (Survey Analytics) ← GPS history + routes
Module 4 (Playback)        ← GPS history API
Module 5 (Heatmap)         ← GPS history
Module 6 (Driver Guidance) ← Routes + Socket.IO
Module 7 (Alert Center)    ← Modules 1, 2
Module 8 (Reporting)       ← All data modules
Module 10 (Performance)    ← All modules (optimize last)
```
