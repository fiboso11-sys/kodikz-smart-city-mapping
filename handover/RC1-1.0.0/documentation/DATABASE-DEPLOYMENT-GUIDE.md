# Database Deployment Guide

**Owner:** Kodikz (schema/migrations) · Dubai (Postgres hosting/ops)  
**Engine:** PostgreSQL **16**  
**Schema version:** `POSTGRES_SCHEMA_VERSION = 1` (`src/lib/db/postgres/schema.ts`)  

## Compatibility

| Item | Requirement |
|------|-------------|
| PostgreSQL | 16.x (Compose: `postgres:16-alpine`) |
| Extensions | **None required** beyond default |
| SSL | Pilot private Docker net: `DATABASE_SSL=false` OK · Municipality: `true` |
| Pool | `DATABASE_POOL_MAX` default **20** (pilot) / **40** (municipality example) |

## What ships

| Artifact | Path |
|----------|------|
| Migration SQL + indexes | `src/lib/db/postgres/schema.ts` (`POSTGRES_MIGRATION_001`) |
| Apply + seed roles/perms/tenant | `src/lib/db/postgres/migrate.ts` · `pnpm migrate:pg` |
| Pool | `src/lib/db/postgres/pool.ts` |
| Backup / restore scripts | `deploy/backup/pg-backup.sh`, `pg-restore.sh` |

## Data classes

| Class | Contents | Production |
|-------|----------|------------|
| **Required schema** | All `CREATE TABLE` / indexes / constraints in migration 001 | **Must apply** |
| **Required reference seed** | Roles, permissions, role_permissions, tenant `dubai-giscd` | **Must apply** (via migrate) |
| **Optional demo / local auth seed** | In-memory/local users with password `ChangeMe!Pilot1` (auth provider) | **Must rotate / replace** — never leave default in pilot |
| **Never load in production** | SQLite local DBs, developer mock fixtures, `MOCK_AUTH` users | Forbidden when `DEPLOYMENT_MODE=pilot|municipality` |

## MongoDB

**Not part of survey Postgres.** Owned by GPS backend stack. Dubai keeps GPS Mongo separate.

## Connection string (placeholder)

`postgresql://USER:PASSWORD@postgres:5432/giscd`
