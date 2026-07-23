# GitHub Publication Plan — Phase 6.4

**Status:** PREPARED — **NOT EXECUTED**  
**Date:** 2026-07-23

Await explicit Release Manager approval before any network operation.

## Sequence

1. Push branch (`git push origin phase2/dubai-giscd-enhancements`)
2. Verify remote branch (commits, file tree, no `frontend/`/`backend/` tracked)
3. Open Pull Request (use `PULL-REQUEST-DRAFT.md`)
4. Review PR (CODEOWNERS / RM)
5. Merge through protected workflow (after protection enabled, or interim RM process)
6. Publish GitHub Release (notes from CHANGELOG / RELEASE-NOTES; do **not** move `v1.0.0-rc1`)
7. Enable Branch Protection
8. Create Labels
9. Create Milestones
10. Create GitHub Project
11. Invite Dubai Team
12. Pilot Deployment (Dubai infrastructure)
13. Pilot Acceptance

## Explicitly deferred (this phase)

Push · Merge · Deploy · Publish Release · Branch protection · Collaborator invites · Tag moves · History rewrite · Force push
