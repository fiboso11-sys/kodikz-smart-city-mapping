# Phase 2.3 — Socket Events

GPS vehicle positions continue to use the existing **single** Socket.IO client to the external GPS backend (Phase 1 — unchanged).

Survey collaboration uses the **same Socket.IO event names** over an SSE transport (`/api/survey-events`) so Next.js can publish without a second Socket.IO server process.

## Event names

| Event | When |
|-------|------|
| `survey_assignment_created` | Assignment created |
| `survey_assignment_updated` | Any status/field change |
| `survey_started` | Survey started |
| `survey_paused` | Survey paused |
| `survey_resumed` | Survey resumed |
| `survey_completed` | Survey completed |
| `survey_decision_updated` | SGE decision persisted |
| `survey_alert_created` | Supervisor alert saved |
| `survey_alert_acknowledged` | Alert acknowledged |
| `blockage_reported` | Blockage saved |
| `supervisor_command` | Pause/Resume/Cancel/Diversion/Return |
| `driver_message` | Supervisor SEND_MESSAGE |
| `survey_photo_uploaded` | Photo metadata saved |
| `survey_notification` | Notification generated |

## Client

`useSurveySync(tenantId)` — single shared `EventSource`, ref-counted, applies assignment updates without refresh.
