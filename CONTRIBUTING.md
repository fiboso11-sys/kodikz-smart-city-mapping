# Contributing Guide

Thank you for contributing to the Dubai Street Mapping Monitoring System.

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Stable baseline |
| `release/dubai-giscd-phase1-rc` | Phase 1 pilot release line |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation only |

## Workflow

1. **Fork** or clone the repository
2. **Create a branch** from `release/dubai-giscd-phase1-rc`:
   ```bash
   git checkout release/dubai-giscd-phase1-rc
   git pull origin release/dubai-giscd-phase1-rc
   git checkout -b feature/your-feature-name
   ```
3. **Make changes** — keep scope focused
4. **Verify locally:**
   ```bash
   pnpm type-check
   pnpm build
   ```
5. **Commit** with a clear message
6. **Open a Pull Request** against `release/dubai-giscd-phase1-rc`

## Commit Naming

Use conventional prefixes:

| Prefix | Use |
|--------|-----|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `chore:` | Tooling, deps |
| `refactor:` | Code restructure (no behavior change) |

Example: `fix: format GPS timestamps in Dubai timezone`

## Pull Requests

- One logical change per PR
- Include summary and test plan
- Link related issues
- Ensure `pnpm type-check` and `pnpm build` pass
- Do not commit `.env`, `data/`, or build artifacts

## Code Review

- At least **1 approval** required before merge (recommended branch protection)
- Dubai team + India team reviewers for production changes
- No force-push to `release/dubai-giscd-phase1-rc` or `master`

## Merge Rules

- Squash or merge commit — team preference; keep history readable
- Delete feature branch after merge
- Tag releases per [RELEASE-NOTES-v1.0-GISCD-PILOT.md](./RELEASE-NOTES-v1.0-GISCD-PILOT.md)

## Canonical Codebase

Deploy and develop from **repository root** (`src/`). Legacy folders `frontend/` and `backend/` are archived references — do not extend them for Phase 1.

## Questions

Open a GitHub issue with label `question` or contact the repository maintainers.
