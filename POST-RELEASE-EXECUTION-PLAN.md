# Post-Release Execution Plan

**Execute only after Release Manager approval. Phase 5.9 does not run these steps.**

## Exact order

1. **Commit** approved Phase 5.6–5.8 work (clean message(s); no secrets)  
2. **Push** repository (`phase2/dubai-giscd-enhancements`) — approval required  
3. **Verify GitHub** (files, CI on PR/branch, tag still `8612a33f…`)  
4. **Publish GitHub Release** using `GITHUB-RELEASE-DRAFT.md` (attach package notes; do not attach secrets)  
5. **Enable Branch Protection** per `BRANCH-PROTECTION-GUIDE.md`  
6. **Create Labels** per `ISSUE-LABEL-STANDARD.md`  
7. **Create Milestones** per `PROJECT-MANAGEMENT-PLAN.md`  
8. **Create Project Board** columns per plan  
9. **Invite Dubai Team** per `ACCESS-CONTROL-MATRIX.md` (least privilege)  
10. **Dubai clones** repository  
11. **Dubai deploys** using `handover/RC1-1.0.0/` Quick Start  
12. **Dubai runs** `validate.sh`  
13. **Dubai completes** Acceptance Checklist  
14. **Pilot begins**  
15. **Kodikz supports** pilot (support.sh / hotfix policy)

## Parallel Kodikz action (can precede Dubai deploy)

- Docker build host: produce `kodikz-smart-city-app:1.0.0-rc1` + offline tar; refresh digests/checksums if needed (separate approved change)
