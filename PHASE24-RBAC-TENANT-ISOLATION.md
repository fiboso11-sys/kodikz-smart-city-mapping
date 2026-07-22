# RBAC and Tenant Isolation

Roles: SUPER_ADMIN, TENANT_ADMIN, SUPERVISOR, DRIVER, VIEWER

Permission constants: `src/lib/auth/permissions.ts`

Tenant isolation is enforced in API handlers. Browser-supplied tenantId/role are never trusted for authorization.

Automated tests: `pnpm test:rbac`
