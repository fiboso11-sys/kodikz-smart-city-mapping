# Phase 3 — RBAC

Roles: SUPER_ADMIN, TENANT_ADMIN, SUPERVISOR, DRIVER, VIEWER

Permissions: `src/lib/auth/permissions.ts`

All survey APIs use `withSurveyAuth` / `resolveAuthContext`.
Tenant always from server session — never trusted from browser alone.

Tests: `pnpm test:rbac`, `pnpm test:api-auth`
