# GitHub Collaboration Readiness — Standards Checklist

**Release:** Version 1.0.0 RC1 (`v1.0.0-rc1`)  
**Date:** 2026-07-23

| File / area | Status | Notes |
|-------------|--------|-------|
| `README.md` | PASS (enhanced) | RC1 banner + handover pointers added; Phase 1 content retained |
| `LICENSE` | PASS | Proprietary grant for authorized Dubai use |
| `CONTRIBUTING.md` | PASS (updated) | RC1 branch/hotfix rules added |
| `SECURITY.md` | PASS | Created |
| `CHANGELOG.md` | PASS | Created for 1.0.0-rc1 |
| `CODE_OF_CONDUCT.md` | PASS | Created |
| `RELEASE-NOTES.md` | PASS | Exists |
| `KNOWN-LIMITATIONS.md` | PASS | Exists (root + handover copy) |
| `.github/pull_request_template.md` | PASS (updated) | RC1 targets |
| `.github/ISSUE_TEMPLATE/*` | PASS | Bug, feature, hotfix |
| `.github/CODEOWNERS` | PASS | Update Dubai handles when known |
| `.github/workflows/build.yml` | PASS (updated) | Includes RC1 working branch |
| Dependabot | OPTIONAL | Config prepared, not enabled without approval |
| GitHub Actions docs | PASS | Documented in this file + BRANCH-PROTECTION-GUIDE |

## CI workflow

Workflow: `.github/workflows/build.yml` — job name **Type-check and Build**.  
Runs on PRs/pushes to protected collaboration branches. Does not deploy.

## Do not execute without approval

- Push commits
- Invite collaborators
- Enable branch protection in GitHub UI
- Publish GitHub Release
