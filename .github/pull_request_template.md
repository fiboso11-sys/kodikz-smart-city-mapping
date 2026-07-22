# Pull Request

## Summary

<!-- What does this PR change and why? -->

## Type

- [ ] Bug fix / hotfix (RC1 policy)
- [ ] Documentation
- [ ] Deployment / operations package
- [ ] Feature (**not allowed on frozen RC1 without Product approval**)
- [ ] Refactor (no behavior change)

## Target branch

- [ ] `phase2/dubai-giscd-enhancements` (RC1 working line) **or** documented exception
- [ ] Hotfix branched from tag `v1.0.0-rc1` when applicable

## Test Plan

- [ ] `pnpm type-check` / `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] Relevant UAT / RBAC (if auth or survey touched)
- [ ] No secrets or `.env` files committed

## Checklist

- [ ] Follows `COLLABORATION-POLICY.md` and `RC1-HOTFIX-POLICY.md`
- [ ] Documentation updated if needed
- [ ] No unrelated changes
- [ ] Dubai impact noted (none / docs / deploy scripts / app)
