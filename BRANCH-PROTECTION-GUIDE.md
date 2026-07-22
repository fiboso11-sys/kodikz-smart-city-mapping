# Branch Protection Guide — Phase 5.8

**Status:** Document only — **do not enable in GitHub until approved.**

**Repository:** `fiboso11-sys/kodikz-smart-city-mapping`  
**Primary protected branch (RC1):** `phase2/dubai-giscd-enhancements`  
**Also protect (legacy Phase 1 line):** `release/dubai-giscd-phase1-rc`  
**Optional:** `master`

## Navigate

1. GitHub → **Settings** → **Branches** → **Add branch protection rule**
2. Branch name pattern: `phase2/dubai-giscd-enhancements`

## Exact recommended settings

| Setting | Value |
|---------|--------|
| Require a pull request before merging | Enabled |
| Required approvals | **1** |
| Dismiss stale pull request approvals when new commits are pushed | Enabled |
| Require review from Code Owners | Enabled |
| Require status checks to pass before merging | Enabled |
| Status checks required | `Type-check and Build` (workflow job name) |
| Require branches to be up to date before merging | Enabled |
| Require conversation resolution before merging | Enabled |
| Do not allow bypassing the above settings | Enabled |
| Restrict who can push to matching branches | Enabled (Release Managers only) |
| Allow force pushes | **Disabled** |
| Allow deletions | **Disabled** |
| Require signed commits | **Recommended** (enable when team GPG/SSH signing ready) |

Repeat the same rule for `release/dubai-giscd-phase1-rc` if that branch remains active.

## Tag protection (recommended)

Protect tag pattern `v1.0.0-rc1` / `v1.0.0*` — only Release Manager may create/move tags.  
**Do not move** frozen `v1.0.0-rc1` without explicit release approval.

## Related

Historical notes: `BRANCH-PROTECTION.md` · CI: `.github/workflows/build.yml`
