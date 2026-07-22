# Database package notes (RC1)

## Reference data (applied by migrate)

- Schema migration v1
- Roles / permissions
- Default tenant `dubai-giscd`

Applied by: `./scripts/migrate.sh`

## Demo data

**Not shipped for production handover.**  
`./scripts/load-demo-data.sh` refuses automatic load and warns strongly.

Never run demo loaders on the Dubai pilot without written approval.

## Ownership

| Store | Owned by this package? |
|-------|------------------------|
| PostgreSQL | Yes (Compose `postgres`) |
| MinIO | Yes (Compose `minio`) |
| MongoDB | No — GPS backend external |

## Rollback

Prefer `./scripts/restore.sh` from a pre-change backup.  
`./scripts/rollback-database.sh` does not invent a down-migration for RC1.
