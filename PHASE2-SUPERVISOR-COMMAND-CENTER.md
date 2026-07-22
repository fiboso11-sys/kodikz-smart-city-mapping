# Phase 2.2 — Supervisor Command Center

**Route:** `/survey-guidance`  
**Date:** 2026-07-16

---

## Purpose

Air-traffic-style operations console for supervisors.

## Live Overview KPIs
Total Surveys · Active · Completed · Paused · Off Route · Warnings · GPS Lost · Blockages

## Vehicle Table
Vehicle · Driver · Assignment · Current Road · Status · Completion · Deviation · Remaining · GPS · Alerts

## Live Map
Existing MapLibre `MapView` with SGE overlay (route / completed / remaining / corridor).  
No map remount. Marker updates in place.

## Vehicle Detail Panel
- Assignment, driver, permit
- Progress bar
- Commands: Pause, Resume, Cancel, Request Return, Approve Diversion, Ack Alerts
- Send message → Alert Center
- Timeline (Event Bus)
- Decision history
- Voice / blockage counts

## Alert Center
Integrated panel with acknowledge / dismiss / CSV export.
