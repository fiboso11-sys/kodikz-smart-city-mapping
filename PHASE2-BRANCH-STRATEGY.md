# Phase 2 Branch Strategy

**Project:** Dubai Street Mapping Monitoring System  
**Phase:** 2 — GISCD Enhancements  
**Date:** 2026-07-15

---

## Branch Hierarchy

```
main
│
├── release/dubai-giscd-phase1-rc          ← Phase 1 stable (v1.0-giscd-rc1)
│   │
│   ├── fix/live-map-marker-stability      ← Current fix branch (pending merge)
│   │
│   └── phase2/dubai-giscd-enhancements    ← Phase 2 integration branch
│       │
│       ├── feature/phase2-route-deviation
│       ├── feature/phase2-driver-guidance
│       ├── feature/phase2-survey-analytics
│       ├── feature/phase2-violation-detection
│       ├── feature/phase2-playback
│       ├── feature/phase2-coverage-heatmap
│       ├── feature/phase2-alert-center
│       ├── feature/phase2-reporting
│       ├── feature/phase2-audit-trail
│       └── feature/phase2-performance
```

---

## Branch Descriptions

| Branch | Purpose | Lifetime |
|--------|---------|----------|
| `release/dubai-giscd-phase1-rc` | Stable Phase 1 release | Permanent |
| `phase2/dubai-giscd-enhancements` | Phase 2 integration/dev | Until Phase 2 release |
| `feature/phase2-*` | Individual module development | Until merged to phase2/ |

---

## Rules

### Phase 1 Release Branch
- **NO direct commits** (frozen)
- Only receives hotfix PRs for critical production bugs
- Any hotfix must pass full Phase 1 quality gate

### Phase 2 Integration Branch
- Created from `release/dubai-giscd-phase1-rc` after fix branch merge
- Receives feature PRs via squash merge only
- Must always pass build and type-check
- Periodically rebased/merged from release branch for hotfixes

### Feature Branches
- Created from `phase2/dubai-giscd-enhancements`
- Naming convention: `feature/phase2-<module-name>`
- One module per branch (no cross-module changes)
- Must pass full quality gate before merge

---

## Git Commands to Create Phase 2 Branch

```bash
# Ensure fix branch is merged first, then:
git checkout release/dubai-giscd-phase1-rc
git pull origin release/dubai-giscd-phase1-rc
git checkout -b phase2/dubai-giscd-enhancements
git push -u origin phase2/dubai-giscd-enhancements
```

## Git Commands to Start a Feature Module

```bash
# Example: starting Module 1 (Route Deviation)
git checkout phase2/dubai-giscd-enhancements
git pull origin phase2/dubai-giscd-enhancements
git checkout -b feature/phase2-route-deviation
git push -u origin feature/phase2-route-deviation
```

## Merging a Completed Feature

```bash
# After quality gate passes:
git checkout phase2/dubai-giscd-enhancements
git pull origin phase2/dubai-giscd-enhancements
git merge --squash feature/phase2-route-deviation
git commit -m "feat: add route deviation detection (Phase 2 Module 1)"
git push origin phase2/dubai-giscd-enhancements
```

---

## Merge Checklist (Per Feature)

- [ ] Feature branch builds without errors
- [ ] All quality gate criteria satisfied
- [ ] Code review approved by at least 1 reviewer
- [ ] No merge conflicts with integration branch
- [ ] PR description includes:
  - Summary of changes
  - Screenshots/videos (if UI changes)
  - Test plan
  - Rollback plan

---

## Release Process (Phase 2 → Production)

1. All 10 modules merged to `phase2/dubai-giscd-enhancements`
2. Full regression test against Phase 1 features
3. Performance audit
4. Create release tag: `v2.0-giscd-rc1`
5. Deploy to staging
6. Dubai Municipality acceptance testing
7. Create `release/dubai-giscd-phase2-rc`
8. Deploy to production
