# Phase 2.3 — Notifications

Generated inside `surveyService` (not UI):

| Type | Trigger |
|------|---------|
| `SURVEY_ASSIGNED` | Assignment created |
| `WRONG_DIRECTION` | Persisted SGE decision |
| `OFF_ROUTE` | Persisted SGE decision |
| `GPS_LOST` | `GPS_UNRELIABLE` decision |
| `ROAD_BLOCKAGE` | Blockage reported |
| `SURVEY_COMPLETED` | Survey completed |
| `EMERGENCY` | `recordEmergency` |
| `CMD_*` | Supervisor diversion/message/return |

## API

- `GET /api/survey-notifications?tenantId=`
- `PATCH /api/survey-notifications` `{ id, action: "read" }`

## Client

`notificationService.list()` / `markRead()`.

History, read flag, and acknowledgement fields are stored in SQLite `survey_notifications`.
