# PostgreSQL Schema

Source of truth: `src/lib/db/postgres/schema.ts` (migration 001).

Core tables include tenants, users, roles, permissions, drivers, vehicles, routes, permits, survey_assignments (with version), survey_sessions, survey_decisions, survey_progress, survey_alerts, survey_commands, blockage_reports, photo_attachments, notifications, audit_events, offline_sync_operations, application_sessions, event_outbox, background_jobs.

Timestamps are TIMESTAMPTZ (UTC). Presentation converts to Asia/Dubai.
