# GitHub Release Checklist — Phase 6.5

**Status:** PREPARED — **NOT EXECUTED**  
**Date:** 2026-07-23

## Consistency review

| Artifact | Status |
|----------|--------|
| `CHANGELOG.md` | PASS — RC1 section + Unreleased repo hygiene |
| `RELEASE-NOTES.md` | PASS |
| `handover/RC1-1.0.0/RELEASE-NOTES.md` | PASS |
| `KNOWN-LIMITATIONS.md` | PASS |
| Support plan / OPERATOR-SUPPORT-GUIDE | PASS (referenced) |
| `RELEASE-MANIFEST.json` / `VERSION` | PASS — tag + freeze SHA aligned |

## Suggested GitHub Release (after push + merge policy)

| Field | Value |
|-------|-------|
| Tag | **Use existing** `v1.0.0-rc1` (do **not** recreate/move) |
| Title | `RC1 1.0.0 — Kodikz Smart City Mapping & Survey Guidance` |
| Target | Freeze commit `8612a33f…` **or** attach notes to that tag without retargeting |
| Body sources | CHANGELOG `[1.0.0-rc1]` + RELEASE-NOTES + KNOWN-LIMITATIONS |

## Checklist (execute only after RM approval)

- [ ] Branch pushed and verified
- [ ] PR reviewed / merged per protection rules (if required before Release)
- [ ] Confirm tag still points to `8612a33f03db738cffc0bfd6bd089abe3f8fd414`
- [ ] Create GitHub Release **from existing tag** (no tag move)
- [ ] Attach or link `handover/RC1-1.0.0/` package description
- [ ] Mark as pre-release if RM prefers (RC1 pilot)

## Explicitly forbidden

- Moving `v1.0.0-rc1`
- Force-updating the tag
- Publishing without RM approval
