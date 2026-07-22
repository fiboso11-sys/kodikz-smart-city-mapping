# Database Audit — Phase 4 RC

## PostgreSQL design (static)

Source: `src/lib/db/postgres/schema.ts`

- Normalized tenants/users/roles/assignments/decisions/alerts/commands/blockages/photos/audit/outbox
- Indexes on tenant, vehicle, assignment, status, outbox pending
- FK relationships defined
- Assignment `version` for optimistic concurrency
- Photo **metadata only** (no binaries in DB)
- Timestamps TIMESTAMPTZ (UTC)

## Mode enforcement

| Mode | SQLite | PostgreSQL |
|------|--------|------------|
| local | allowed | optional |
| pilot/municipality | **forbidden** (fail closed) | required |

Verified by `pnpm test:api-auth` (pilot without DATABASE_URL fails).

## Migration / backup

Scripts present: migrate, sqlite-to-postgres export/import, pg-backup.sh, pg-restore.sh.

| Check | Status |
|-------|--------|
| Schema static review | PASS |
| Live migrate | NOT EXECUTED |
| Backup/restore proof | NOT EXECUTED |

## Verdict

**PASS** (design) / **NOT EXECUTED** (live Postgres operations)
