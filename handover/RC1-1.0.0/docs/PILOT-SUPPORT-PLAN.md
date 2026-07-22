# Pilot Support Plan — RC1 1.0.0

**Release:** RC1 1.0.0 (`v1.0.0-rc1`)  
**Date:** 2026-07-22  
**Status:** Application frozen for internal pilot  

---

## Supported pilot scope

| In scope | Out of scope |
|----------|----------------|
| Survey Guidance, Driver Copilot, Command Center | New features / UI redesign |
| Assignment lifecycle (assign → pause/resume → complete) | API contract changes |
| Live GPS via existing GPS backend | Relocating/replacing GPS Mongo stack |
| Postgres + MinIO as documented | Schema redesign |
| Auth local JWT (pilot) + RBAC | OIDC go-live unless separately approved |
| Bug fixes that are **critical production blockers** found in pilot | Refactors, optimizations, “nice to have” |
| Handover documentation support | Dubai VPS provisioning / Docker install / TLS / DNS (Dubai-owned) |

---

## Critical bug process

1. **Classify:** Does it block pilot operations (login, assign, start/pause, GPS live, map, data loss, security)?  
2. **If yes — Critical:** Open issue with repro, logs, environment, severity = Critical.  
3. **Kodikz triage within 1 business day** (pilot hours).  
4. **Fix** only on a hotfix branch from the freeze tag; no feature work.  
5. **Regression:** type-check + build + relevant UAT/RBAC.  
6. **Deliver** patched commit/tag (e.g. `v1.0.0-rc1.1`) with release note delta.  
7. **If not critical:** Log as backlog for post-pilot; do not change RC1 freeze line without Product approval.

---

## Issue reporting workflow

Provide at minimum:

- Pilot site / timestamp (Asia/Dubai)
- User role (supervisor/driver)
- URL / page
- Steps to reproduce
- Expected vs actual
- Screenshots
- `docker compose logs` excerpt (app/worker/nginx) — **no secrets**
- Browser console errors (if UI)

Channel: project issue tracker / agreed Dubai↔Kodikz channel (fill contacts below).

---

## Escalation contacts

| Role | Contact | Notes |
|------|---------|-------|
| Kodikz Release Manager | _TBD — fill before handover_ | Freeze / hotfix approval |
| Kodikz Engineering | _TBD_ | Critical bug triage |
| Dubai Infrastructure Lead | _TBD_ | Server / Docker / TLS / DNS |
| Dubai Pilot Product Owner | _TBD_ | Scope / acceptance |

---

## Known limitations

See `KNOWN-LIMITATIONS.md` (bundled in handover package).

---

## Out-of-scope requests (decline or defer)

- New screens, workflows, or SGE rule changes during pilot  
- Database redesign or new migrations beyond hotfixes  
- Unrelated Phase 1 cosmetic work  
- “While you’re in there” refactors  

Route such requests to the post-pilot backlog.
