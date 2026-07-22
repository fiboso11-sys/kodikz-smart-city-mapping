# Phase 2.2 — Driver Survey Copilot

**Route:** `/survey-copilot`  
**Date:** 2026-07-16

---

## Purpose

Mobile-first OEM-style assistant for survey drivers.  
Answers: **What do I need to do right now?**

Consumes SGE decisions only — never recalculates route logic.

## Screens

### Home
- Large survey status (ON ROUTE / OFF ROUTE / …)
- Completion % + progress bar
- Remaining distance + ETA
- Current street / GPS quality
- Segment metrics, speed, heading, network

### Actions (large touch targets)
- Pause / Resume
- Report Blockage
- Need Supervisor
- Emergency
- Finish Survey

### Progress
- Completed / remaining distance & segments
- Wrong direction flag
- Quality score (derived from decision fields, not a second engine)

### Voice
- Mute / unmute
- Volume slider + test
- Voice history with cooldown markers

## Start Flow
If no active session: pick vehicle → assign route (RouteAssigner) → SGE session starts.

## Design
- Dark professional theme
- Sunlight-readable contrast
- Arabic-ready (logical LTR structure, large type, no cramped columns)
- Max-width mobile shell (`max-w-lg`)
