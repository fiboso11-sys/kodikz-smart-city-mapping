# Phase 2.3 — Backend Services

## Service layer

- `src/services/survey/survey-service.ts` — domain operations + audit + notifications
- `src/services/survey/event-hub.ts` — in-process pub/sub
- `src/services/survey/photo-storage.ts` — files under `data/survey-photos/`
- `src/services/survey/client-api.ts` — browser client (UI entry point)
- `src/lib/repositories/survey/survey-repository.ts` — SQLite / memory

## HTTP APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/survey-assignments` | List / create (+ optional autoStart) |
| GET/PATCH | `/api/survey-assignments/{id}` | Get / approve |
| POST | `/api/survey-assignments/{id}/start` | Start |
| POST | `/api/survey-assignments/{id}/pause` | Pause |
| POST | `/api/survey-assignments/{id}/resume` | Resume |
| POST | `/api/survey-assignments/{id}/complete` | Complete |
| POST | `/api/survey-assignments/{id}/cancel` | Cancel |
| GET/POST | `/api/survey-decisions` | List / persist SGE decisions |
| GET/POST | `/api/survey-alerts` | List / create / acknowledge |
| GET/POST | `/api/blockages` | List / report |
| GET | `/api/survey-timeline` | Audit-derived timeline |
| GET | `/api/survey-history` | Completed/cancelled assignments |
| GET/POST | `/api/survey-progress` | Progress snapshots |
| GET | `/api/survey-events` | SSE real-time stream |
| GET/POST/DELETE | `/api/survey-photos` | Photo metadata + upload |
| GET/PATCH | `/api/survey-notifications` | Notification history / read |
| POST | `/api/survey-commands` | Supervisor commands |
| GET | `/api/survey-audit` | Raw audit log |

## Isolation

- Tenant filter via `tenantId` (default `dubai-giscd`)
- Assignment and vehicle IDs scoped on every mutation
- UI must use `surveyApi` / `surveyService` — never repositories directly
