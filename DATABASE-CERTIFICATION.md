# Database Certification — RC1 1.0.0

| Item | Status |
|------|--------|
| Schema version | **1** (`POSTGRES_SCHEMA_VERSION`) |
| Migration order | Single migration `POSTGRES_MIGRATION_001` then seed roles/perms/tenant |
| Rollback | Restore-from-backup (documented) — no down SQL |
| Seed separation | Schema+RBAC/tenant required; demo passwords must rotate |
| Guides | Deployment / Migration / Rollback / Backup-Restore present |
| Validation queries | In migration runbook |
| Postgres version | 16 documented |

## Verdict

**PASS** (package). Live migrate on Dubai PG → Dubai runtime.
