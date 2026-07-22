# Phase 3 — Authentication

- Provider abstraction: Local / OIDC stub / Mock (local only)
- bcrypt passwords, JWT (jose), HttpOnly cookie, login throttle/lockout, session revoke
- Login: `POST /api/auth/login`
- Logout: `POST /api/auth/logout`
- Server context: userId, tenantId, roles, permissions, sessionId, requestId

Tests: `pnpm test:rbac`
