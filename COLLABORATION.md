# GitHub Collaboration Guide

**Repository:** [fiboso11-sys/kodikz-smart-city-mapping](https://github.com/fiboso11-sys/kodikz-smart-city-mapping)  
**Release branch:** `release/dubai-giscd-phase1-rc`

---

## Quick Links

| Resource | Location |
|----------|----------|
| Contributing | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| Branch protection | [BRANCH-PROTECTION.md](./BRANCH-PROTECTION.md) |
| PR template | [.github/pull_request_template.md](./.github/pull_request_template.md) |
| Bug report | [.github/ISSUE_TEMPLATE/bug_report.md](./.github/ISSUE_TEMPLATE/bug_report.md) |
| Feature request | [.github/ISSUE_TEMPLATE/feature_request.md](./.github/ISSUE_TEMPLATE/feature_request.md) |
| CODEOWNERS | [.github/CODEOWNERS](./.github/CODEOWNERS) |
| CI workflow | [.github/workflows/build.yml](./.github/workflows/build.yml) |

---

## Pull Request Workflow

1. Branch from `release/dubai-giscd-phase1-rc`
2. Use prefix: `feature/`, `fix/`, or `docs/`
3. Run locally: `pnpm type-check` && `pnpm build`
4. Open PR — template auto-loads
5. Wait for **Build** CI + 1 approval
6. Squash merge

---

## Issue Templates

- **Bug Report** — production defects
- **Feature Request** — Phase 2 ideas (requires approval for Phase 1)

---

## CODEOWNERS

Default reviewer: `@fiboso11-sys`  
Add Dubai team GitHub usernames when accounts are provisioned.

---

## Repository Access

| Team | Role |
|------|------|
| India development | Write |
| Dubai GISCD | Read + Issues |
| Release manager | Admin |

---

## CI

GitHub Actions **Build** workflow runs on every push and pull request to `release/dubai-giscd-phase1-rc` and `master`.

---

## Deploy Path

Always develop and deploy from **repository root** (`src/`).  
Do **not** use legacy `frontend/` or `backend/` folders for Phase 1.

See also [.github/COLLABORATION.md](./.github/COLLABORATION.md) for extended setup notes.
