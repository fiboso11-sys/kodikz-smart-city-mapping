# GitHub Collaboration Setup

## Recommended Branch Protection (`release/dubai-giscd-phase1-rc`)

| Rule | Setting |
|------|---------|
| Require pull request before merging | Yes |
| Required approvals | 1 |
| Require status checks | `build` (when CI added) |
| Restrict force pushes | Yes |
| Restrict deletions | Yes |

## Pull Request Workflow

1. Developer creates `feature/*` or `fix/*` branch
2. Opens PR to `release/dubai-giscd-phase1-rc`
3. Fills PR template checklist
4. Reviewer approves
5. Squash merge
6. Tag releases (`v1.0.x-giscd-pilot`)

## Issue Templates

Located in `.github/ISSUE_TEMPLATE/`:

- **Bug Report** — defects
- **Feature Request** — Phase 2 ideas

## CODEOWNERS

`.github/CODEOWNERS` assigns `@fiboso11-sys` as default reviewer. Update with Dubai team GitHub handles when available.

## Repository Access

| Team | Suggested Role |
|------|----------------|
| India development | Write |
| Dubai GISCD operators | Read + Issues |
| Release manager | Admin |

## CI

GitHub Actions workflow [`.github/workflows/build.yml`](./.github/workflows/build.yml) runs on push and pull request:

- `pnpm install --frozen-lockfile`
- `pnpm type-check`
- `pnpm build`

Enable as required status check per [BRANCH-PROTECTION.md](./BRANCH-PROTECTION.md).

## Canonical Deploy Path

Always deploy from **repository root** — not `frontend/` or `backend/`.
