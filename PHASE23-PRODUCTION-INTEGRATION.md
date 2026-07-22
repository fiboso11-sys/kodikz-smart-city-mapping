# Phase 2.3 — Production Integration

**Branch:** `phase2/dubai-giscd-enhancements`  
**Scope:** Production persistence, API layer, real-time sync, photos, notifications, EN/AR, offline, audit, field pilot.  
**Constraint:** Survey Guidance Engine remains the only source of survey decisions. Phase 1 frozen.

## Architecture

```
UI / Stores
    ↓ (surveyApi client — never touch DB)
Next.js API routes
    ↓
surveyService
    ↓
SurveyRepository (SQLite → memory fallback)
    ↓
Event Hub (Socket.IO event names over SSE)
```

SGE still computes decisions client-side. Phase 2.3 **persists and synchronizes** those decisions; it does not recalculate corridor/heading logic in APIs.

## Delivered capabilities

| Area | Status |
|------|--------|
| Persistent assignments | ✓ SQLite + memory fallback |
| Assignment lifecycle | ✓ Create → Approve → Start → Pause → Resume → Complete → Cancel |
| Production APIs | ✓ See PHASE23-BACKEND-SERVICES.md |
| Real-time sync | ✓ SSE with Socket.IO event names |
| Photo attachments | ✓ Camera/gallery/compress/upload/retry/delete |
| Supervisor commands | ✓ Via `/api/survey-commands` + events |
| Notifications | ✓ Generated on domain events |
| EN / AR + RTL | ✓ Resource-only i18n |
| Reverse geocoding | ✓ Nominatim + RoadResolver cache |
| Offline queue | ✓ Coalesce + flush + conflict handling |
| Audit → timeline | ✓ Timeline built from audit |
| Field pilot mode | ✓ Ctrl+Shift+P or `?pilot=1` |

## Local validation only

Do **not** commit, push, merge, deploy, or tag from this phase.
