# API & Integration Handover

**Owner:** Kodikz — documentation of **existing** contracts (no contract changes in this phase)

## Base

| Item | Value |
|------|--------|
| Base URL | `https://<APP_HOST>` (Nginx → app:3000) |
| Survey API prefix | `/api/*` |
| Auth header | `Authorization: Bearer <accessToken>` or cookie `kodikz_access` |
| Request id | `x-request-id` (echoed on responses) |

## Auth flow

1. `POST /api/auth/login` `{ email, password, tenantId? }`  
2. Response: `accessToken`, `refreshToken`, `user`, sets HttpOnly cookie  
3. Subsequent APIs: Bearer or cookie  
4. `POST /api/auth/logout`

Error shape: `{ code, message, requestId, details?, validationErrors? }`

## Roles

SUPER_ADMIN · TENANT_ADMIN · SUPERVISOR · DRIVER · VIEWER — see `src/lib/auth/permissions.ts`

## Main endpoint groups

| Area | Paths |
|------|--------|
| Health | `GET /api/health`, `/api/readiness`, `/api/system-health`, `/api/gps/health` |
| Vehicles | `/api/vehicles`, `/api/vehicles/live`, `/api/vehicles/[id]` |
| Permits / geo | `/api/permits`, `/api/geo-uploads`, permit upload routes |
| Assignments | `/api/survey-assignments` + `/[id]` + start/pause/resume/complete/cancel |
| Survey data | decisions, progress, alerts, commands, timeline, history, audit, notifications, photos, blockages, attachments |
| Realtime survey | `GET /api/survey-events` (**SSE**) |

## GPS / Mongo / Socket.IO

| Concern | Owner | Detail |
|---------|-------|--------|
| Live GPS positions | GPS backend | Browser Socket.IO to `NEXT_PUBLIC_SOCKET_URL` |
| MongoDB | GPS backend | Survey app does **not** connect |
| Survey collaboration events | Survey app | SSE event names (compat names from Phase 23): `survey_assignment_*`, `survey_started/paused/resumed/completed`, `survey_decision_updated`, `survey_alert_*`, `blockage_reported`, `supervisor_command`, `driver_message`, `survey_photo_uploaded`, `survey_notification` |

## Status codes (typical)

200 OK · 400 validation · 401 unauthorized · 403 forbidden · 404 not found · 409 conflict · 429 rate limit · 503 not ready

## Proxy requirements (Dubai Nginx)

- HTTP→HTTPS redirect  
- `Upgrade` / `Connection` for Socket.IO **if** proxied through same host  
- SSE: `proxy_buffering off` for `/api/survey-events`  
- `client_max_body_size` ≥ upload limit (template 12m)  

## CORS

Same-origin via Nginx is preferred. If split origins, Dubai must allow APP origin to API — **confirm with Kodikz before changing**.
