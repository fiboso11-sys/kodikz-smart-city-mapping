# Collaboration Policy

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Release:** Version **1.0.0 RC1**

## Principles

1. Every change uses a topic branch (`feature/*`, `fix/*`, `docs/*`, `hotfix/*`)
2. Every change opens a Pull Request
3. Every PR must pass quality gates (CI type-check/build + relevant tests)
4. Every PR receives at least one review (Code Owners when enabled)
5. **Never** commit directly to protected branches
6. **Never** force-push protected branches or move frozen tag `v1.0.0-rc1` without Release Manager approval
7. **Never** commit secrets, certificates, support bundles, or customer data dumps

## Hotfix workflow (RC1)

1. Classify under `RC1-HOTFIX-POLICY.md` (allowed classes only)
2. Branch from `v1.0.0-rc1` (or protected RC1 line as directed by Release Manager)
3. Minimal fix + tests/docs
4. PR with labels `hotfix` + `critical` + `pilot`
5. Review + CI
6. Dubai validates with `validate.sh` / support bundle as needed
7. Document in CHANGELOG; new patch tag only with approval (do not rewrite `v1.0.0-rc1`)

## Feature work

New features and UI enhancements are **out of scope** for frozen RC1 — target milestone **Version 1.1**.

## Related

`CONTRIBUTING.md` · `BRANCH-PROTECTION-GUIDE.md` · `ACCESS-CONTROL-MATRIX.md` · `SECURITY.md`
