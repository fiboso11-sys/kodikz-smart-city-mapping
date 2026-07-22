# Database Migration Runbook

**Responsible:** Dubai DBA/ops executes · Kodikz supports  

## Order

1. PostgreSQL healthy (`pg_isready`)
2. Set `DATABASE_URL` in environment (no secrets in git)
3. From app image or checkout with deps: `pnpm migrate:pg`
4. Confirm `schema_migrations.version = 1`

## Command

```bash
export DATABASE_URL='postgresql://…'   # from secret store
pnpm migrate:pg
```

Expected console: `{ version: 1, applied: true }` on first run; `applied: false` if already applied.

## Validation queries

```sql
SELECT version, name, applied_at FROM schema_migrations;
SELECT COUNT(*) AS roles FROM roles;
SELECT COUNT(*) AS permissions FROM permissions;
SELECT id, code FROM tenants WHERE id = 'dubai-giscd';
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
```

## Post-migration smoke

1. `curl -sf http://127.0.0.1:3000/api/readiness` → `ready: true`
2. Login as rotated pilot user
3. Create/list assignment (supervisor)

## Failure symptoms

| Symptom | Action |
|---------|--------|
| `DATABASE_URL not configured` | Fix env; restart |
| Connection refused | Postgres not up / wrong host |
| Partial tables | Re-run migrate (IF NOT EXISTS safe); investigate errors |

## Rollback

See `DATABASE-ROLLBACK-RUNBOOK.md` (restore from backup — no down-migration SQL shipped).
