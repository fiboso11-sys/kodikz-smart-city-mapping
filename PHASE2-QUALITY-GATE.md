# Phase 2 Quality Gate

**Project:** Dubai Street Mapping Monitoring System  
**Phase:** 2 — GISCD Enhancements  
**Date:** 2026-07-15

---

## Purpose

No feature branch may be merged into `phase2/dubai-giscd-enhancements` unless ALL criteria below are satisfied. This prevents regressions and ensures production stability.

---

## Mandatory Checks (All Must Pass)

### 1. Build Pipeline

| Check | Command | Criteria |
|-------|---------|----------|
| TypeScript type-check | `pnpm type-check` | 0 errors |
| Production build | `pnpm build` | Exit code 0, all routes rendered |
| Lint (if configured) | `pnpm lint` | 0 errors (warnings acceptable) |

### 2. CI Pipeline

| Check | Criteria |
|-------|----------|
| GitHub Actions CI | All jobs pass (green) |
| Vercel preview deployment | Builds successfully |
| No deployment errors | Vercel functions within limits |

### 3. Regression — Phase 1 Features

| Feature | Verification |
|---------|-------------|
| Dashboard | Loads, KPIs display, map renders |
| Live Monitoring | Live map updates without blinking |
| Vehicles | List loads, detail panel opens |
| Permits | Table displays with pagination |
| Geo Upload | File upload and preview works |
| Settings | All settings persist |
| System Health | Status indicators accurate |
| Sidebar | Navigation functional on all routes |
| Search | Results appear within 500ms |

### 4. GPS & Socket Stability

| Check | Criteria |
|-------|----------|
| GPS status | Remains "CONNECTED" when backend healthy |
| Socket.IO | Single connection only |
| No reconnect loop | No disconnect/reconnect cycling |
| No duplicate listeners | Verify in browser DevTools |
| Update frequency | Vehicles update smoothly (no jump) |
| Grace period | Status shows "RECONNECTING" only after 5s disconnect |

### 5. Map Stability

| Check | Criteria |
|-------|----------|
| No map blinking | Map does not remount on data updates |
| Vehicle markers | Car icon visible (not dot) |
| Heading rotation | Marker rotates with bearing |
| Status ring | Green/yellow/red based on vehicle status |
| Marker click | Opens vehicle detail panel |
| Layer toggles | All layers show/hide correctly |
| Zoom stability | No marker flicker on zoom/pan |

### 6. Browser Console

| Check | Criteria |
|-------|----------|
| React errors | 0 errors |
| React warnings | 0 unexpected warnings |
| MapLibre warnings | 0 warnings |
| Network errors | 0 failed requests (excluding external) |
| Memory leaks | No continuously growing memory |

### 7. Performance

| Metric | Threshold |
|--------|-----------|
| First Load JS | < 150kB shared |
| Page load (dashboard) | < 3s on 4G |
| Map render time | < 2s to first vehicle marker |
| Socket connection | < 1s to establish |

### 8. Vercel Compatibility

| Check | Criteria |
|-------|----------|
| Serverless function size | Under 50MB limit |
| Build time | Under 5 minutes |
| No Node.js-only APIs | Compatible with Edge Runtime where used |
| Environment variables | All required vars documented |

---

## Quality Gate Process

```
1. Developer completes feature on feature branch
2. Run local quality gate:
   pnpm install
   pnpm type-check   → must pass
   pnpm build        → must pass
   pnpm dev          → manual smoke test
3. Push to remote, create PR targeting phase2/dubai-giscd-enhancements
4. CI runs automatically
5. Vercel preview deploys
6. Reviewer verifies:
   - Code review approved
   - All automated checks green
   - Manual regression spot-check
7. Only merge if ALL gates pass
```

---

## Failure Response

If any quality gate fails:

1. **Do NOT merge** the PR
2. Document the failure in the PR comments
3. Fix the issue on the feature branch
4. Re-run the full quality gate
5. Only proceed when all checks pass

---

## Exceptions

No exceptions are permitted for:
- Type-check failures
- Build failures
- Phase 1 regressions
- Map blinking
- Socket instability

Exceptions may be granted (with team lead approval) for:
- Minor lint warnings
- Performance thresholds slightly exceeded (must document plan to fix)
