# Pre-Push Checklist — Phase 6.5

**Date:** 2026-07-23  
**Status:** READY — awaiting Release Manager approval to execute

## Remote

| Item | Value |
|------|-------|
| Remote name | `origin` |
| URL | `https://github.com/fiboso11-sys/kodikz-smart-city-mapping.git` |
| Branch | `phase2/dubai-giscd-enhancements` |
| Tracking | Set or refresh with `-u` on first push of new commits |

## Exact push command (DO NOT run until approved)

```bash
git push -u origin phase2/dubai-giscd-enhancements
```

## Pre-flight confirmations

- [ ] `git status` clean (except intentional ignore of local untracked `backend/` leftovers)
- [ ] `git rev-list -n 1 v1.0.0-rc1` == `8612a33f03db738cffc0bfd6bd089abe3f8fd414`
- [ ] `backup/pre-legacy-cleanup` still at `615609e`
- [ ] No force push
- [ ] No tag push/move unless separately approved
- [ ] Untracked `backend/` **not** added

## Post-push verification

```bash
git fetch origin
git log --oneline origin/phase2/dubai-giscd-enhancements -5
git ls-remote --heads origin phase2/dubai-giscd-enhancements
```

Confirm on GitHub UI: branch exists, latest commits visible, no tracked `frontend/` or `backend/`.
