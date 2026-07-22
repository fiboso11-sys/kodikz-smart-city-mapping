# Phase 3 — Infrastructure

Deployment modes: `local` | `pilot` | `municipality` (`src/lib/config/app-config.ts`).

| Mode | PostgreSQL | S3 storage | Auth | SQLite |
|------|------------|------------|------|--------|
| local | optional | local disk ok | mock/local | allowed |
| pilot | required | S3/MinIO required | real auth required | **forbidden** |
| municipality | required | municipality S3 | OIDC | **forbidden** |

Fail-closed: missing DATABASE_URL in pilot/municipality throws `ConfigError` at startup.
