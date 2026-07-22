# Phase 3 — PostgreSQL

Schema: `src/lib/db/postgres/schema.ts`
Migrate: `src/lib/db/postgres/migrate.ts`
Pool: `src/lib/db/postgres/pool.ts`
SQLite→PG tool: `scripts/sqlite-to-postgres.ts`

SQLite remains local-dev only via `resolveDbBackend()`.

**Live Postgres migrate/backup/restore: NOT EXECUTED on this workstation (no psql/Docker).**
