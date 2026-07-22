# Performance Audit — Phase 4 RC

**Executed:** 2026-07-16

## Executed

| Metric | Result | Status |
|--------|--------|--------|
| SGE stress 100 vehicles × 120 ticks | 12,000 decisions; wall ~682–686 ms | PASS |
| Decision latency p95 | 0.105–0.109 ms (target &lt; 100 ms) | PASS |
| Decision latency p99 | 0.186–0.246 ms | PASS |
| Heap after stress | ~14–15 MB | PASS |
| `pnpm build` First Load JS (shared) | 102 kB | PASS |
| Heaviest pages | `/dashboard` 400 kB · `/survey-guidance` 360 kB · `/live-monitoring` 356 kB | WARNING (acceptable for map apps; monitor) |
| Shared GPS Socket.IO (design) | singleton `LiveGps` provider | PASS (static) |
| Shared survey SSE (design) | ref-counted EventSource | PASS (static) |
| Decision sync throttle | ≥5s / state-change | PASS (static) |

## Not executed

| Item | Status |
|------|--------|
| Webpack/bundle analyzer deep report | NOT EXECUTED |
| 60-minute full-stack soak (API + Postgres + SSE) | NOT EXECUTED |
| Map FPS under 100 live markers | MANUAL VALIDATION REQUIRED |
| React profiler / re-render soak | MANUAL VALIDATION REQUIRED |

## Verdict

**PASS** for SGE CPU path and production build  
**WARNING** for large map page First Load JS  
**NOT EXECUTED / MANUAL** for full-stack and browser soak
