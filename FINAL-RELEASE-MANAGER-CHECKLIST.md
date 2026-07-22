# Final Release Manager Checklist — Phase 6.0

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Release:** Version **1.0.0 RC1** (`v1.0.0-rc1`)  
**Date:** 2026-07-23  
**Status:** Preparation complete — **NO commit / push / publish executed**

---

## Working Tree Review

See `FINAL-WORKING-TREE-REVIEW.md`.

- All intentional changes map to Phases **5.6–5.9** (+ 6.0 prep docs)
- Tooling files (`tsconfig.json`, `next-env.d.ts`) normalized to avoid ephemeral `.next-phase*` paths
- No secrets staged; checksums verified **82/82 OK**

---

## Commit Plan

See `COMMIT-PLAN.md`.

**Recommended:** four logical commits (5.6 / 5.7 / 5.8 / 5.9–6.0).  
**Alternate:** single release-engineering commit.

**Await explicit Release Manager approval before running `git commit`.**

---

## RC1 Tag Verification

| Check | Result |
|-------|--------|
| Tag `v1.0.0-rc1` exists | PASS |
| Points to `8612a33f03db738cffc0bfd6bd089abe3f8fd414` | PASS (`TAG_OK`) |
| Tag moved during Phase 6.0 | NO — not modified |

**Do not move or recreate the tag.**

---

## Release Package Verification

| Item | Status | Version 1.0.0 RC1 |
|------|--------|-------------------|
| Release Notes | PASS | Yes |
| Manifest | PASS | Yes |
| Checksums | PASS (82 files match) | Yes |
| Operator Guide (QUICK-START) | PASS | Yes |
| Support Guide | PASS | Yes |
| Deployment / plug-and-play scripts | PASS | Yes |
| Acceptance Checklist | PASS | Yes |
| Troubleshooting | PASS | Yes |
| Environment templates | PASS | Yes |
| Rollback / backup scripts | PASS | Yes |
| Database guides (handover docs) | PASS | Yes |

Identity consistency: `release-identity.ts` ↔ `VERSION` ↔ `RELEASE-MANIFEST.json` ↔ freeze SHA.

---

## Pre-Push Validation

| Gate | Result |
|------|--------|
| Type-check (`pnpm type-check`) | PASS |
| Lint (`pnpm lint` → tsc) | PASS |
| Production build | PASS (`.next-phase60`; About + system-health routes present) |
| Documentation consistency | PASS (RC1 references present) |
| Secret scan (dirty paths) | PASS — no `.env`/pem/key/support-bundle candidates |
| Version consistency | PASS |
| Manifest consistency | PASS |
| Checksum verification | PASS 82/82 |
| Git status review | FAIL for “clean” — expected until commit |

---

## GitHub Publication Readiness

| Item | Status |
|------|--------|
| Release draft | READY — `GITHUB-RELEASE-DRAFT.md` (**do not publish yet**) |
| Title | RC1 Version 1.0.0 |
| Description / limitations / support / pilot scope | Covered in draft |
| Assets | Package path + checksums (no secret attachments) |
| Branch protection policy | Documented — not enabled |
| Collaborator matrix | Documented — no invites |

---

## Operational Next Steps (exact order)

1. Review modified files (`FINAL-WORKING-TREE-REVIEW.md`)  
2. **Commit** approved work per `COMMIT-PLAN.md` (**approval required**)  
3. Verify clean working tree (`git status`)  
4. **Push** branch (**approval required**)  
5. Verify GitHub (files, CI)  
6. **Publish** GitHub Release from draft (**approval required**)  
7. Enable Branch Protection  
8. Create Labels  
9. Create Milestones  
10. Create Project Board  
11. Invite Dubai Team  
12. Dubai clones repository  
13. Dubai deploys (`handover/RC1-1.0.0/QUICK-START.md`)  
14. Pilot validation (`validate.sh`)  
15. Pilot acceptance checklist  

Also: `POST-RELEASE-EXECUTION-PLAN.md`

---

## Minor note for committer

After any `NEXT_DIST_DIR=... pnpm build`, Next may rewrite `tsconfig.json` / `next-env.d.ts` to reference that dist. **Before commit**, ensure they reference only `.next/types` (already normalized in this prep).

---

## FINAL DECISION

### 1. READY FOR RELEASE MANAGER COMMIT

Working tree content is approved for commit; validations PASS; RC1 tag intact.  
**Stopped before any Git write operation** pending explicit Release Manager approval.
