# API Audit — Phase 4 RC

## Survey APIs (authenticated)

All survey-domain routes use `withSurveyAuth` / `resolveAuthContext`:

assignments (+ lifecycle), decisions, alerts, progress, history, timeline, audit, notifications, events (SSE), commands, blockages, attachments.

Alias: survey-photos → attachments handlers.

## Phase 1 APIs (open by contract)

vehicles, permits, geo-uploads, gps/*, system-health, health, readiness, auth/login

**WARNING:** Phase 1 CRUD lacks RBAC. Changing this would break Phase 1 public APIs — deferred to coordinated pilot hardening, not RC feature change.

## Checklist (survey)

| Requirement | Status |
|-------------|--------|
| Authentication | PASS |
| Authorization | PASS |
| Tenant isolation | PASS (tests) |
| Input validation | PASS (key paths) |
| Structured errors / requestId | PASS (hardened routes) |
| Rate limits | PASS (login/upload/command/mutation) |
| Audit on lifecycle | PASS (service layer) |

## Verdict

**PASS** for survey surface · **WARNING** for Phase 1 open APIs
