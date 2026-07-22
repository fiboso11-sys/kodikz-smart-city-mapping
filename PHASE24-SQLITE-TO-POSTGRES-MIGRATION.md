# SQLite → PostgreSQL Migration

```bash
pnpm migrate:sqlite-export
npx tsx scripts/sqlite-to-postgres.ts dry-run
npx tsx scripts/sqlite-to-postgres.ts import
npx tsx scripts/sqlite-to-postgres.ts validate
```

Creates a pre-migration SQLite backup under `data/migrations/sqlite-export/`.
Does not delete SQLite automatically.
Photo binaries must be copied to object storage separately; metadata migrates.
