# Branch Protection Guide

Recommended GitHub settings for **`release/dubai-giscd-phase1-rc`** on `fiboso11-sys/kodikz-smart-city-mapping`.

---

## Navigate To

1. Open https://github.com/fiboso11-sys/kodikz-smart-city-mapping
2. **Settings** → **Branches** → **Add branch protection rule**
3. Branch name pattern: `release/dubai-giscd-phase1-rc`

---

## Recommended Settings

| Setting | Value | Why |
|---------|-------|-----|
| **Require a pull request before merging** | ✅ Enabled | No direct commits to release branch |
| **Required approvals** | **1** | India + Dubai review gate |
| **Dismiss stale pull request approvals when new commits are pushed** | ✅ Enabled | Re-review after changes |
| **Require review from Code Owners** | ✅ Enabled (when CODEOWNERS updated) | Route reviews to maintainers |
| **Require status checks to pass before merging** | ✅ Enabled | CI must pass |
| **Status checks required** | `Type-check and Build` (from `.github/workflows/build.yml`) | Blocks broken builds |
| **Require branches to be up to date before merging** | ✅ Enabled | Avoid merge skew |
| **Require conversation resolution before merging** | ✅ Enabled | All PR comments resolved |
| **Do not allow bypassing the above settings** | ✅ Enabled | Even admins follow process |
| **Restrict who can push to matching branches** | ✅ Enabled | Release managers only |
| **Allow force pushes** | ❌ Disabled | Protect release history |
| **Allow deletions** | ❌ Disabled | Prevent accidental branch delete |

---

## Optional: Protect `master`

Apply the same rules to `master` if it becomes the long-term default branch.

---

## Pull Request Flow (After Protection)

```
feature/my-change  →  PR  →  release/dubai-giscd-phase1-rc
                              ↓
                         CI build.yml passes
                              ↓
                         1 approval
                              ↓
                         Merge (squash recommended)
```

---

## Enable Required Status Check (After First CI Run)

1. Merge or push `.github/workflows/build.yml` to the branch
2. Wait for **Actions** tab to show a successful **Build** run
3. Return to branch protection rule
4. Search status check: **`Type-check and Build`**
5. Save rule

> Status check names appear only after the workflow runs at least once on the branch.

---

## Restrict Direct Pushes

Under **Restrict who can push to matching branches**, add:

- Release manager (admin)
- CI bot (if using merge queue later)

All other developers use feature branches + PRs.

---

## Related Documents

- [CONTRIBUTING.md](./CONTRIBUTING.md) — branch naming and commit rules
- [COLLABORATION.md](./COLLABORATION.md) — team access and templates
- [.github/CODEOWNERS](./.github/CODEOWNERS) — default reviewers
