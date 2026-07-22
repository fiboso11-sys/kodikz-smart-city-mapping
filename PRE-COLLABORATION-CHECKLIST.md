# Pre-Collaboration Checklist

Complete **before** inviting the Dubai Infrastructure Team to GitHub.

## Repository

- [ ] Repository clean of tracked secrets (`GITHUB-SECURITY-AUDIT.md`)
- [ ] Hygiene warnings acknowledged (`REPOSITORY-HYGIENE-AUDIT.md`)
- [ ] Phase 5.6–5.8 docs/package changes **committed** (approval required — no push in Phase 5.8)
- [ ] `.gitignore` validated (`GITIGNORE-AUDIT.md`)
- [ ] `LICENSE`, `SECURITY.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md` present

## Protection & process (enable after approval)

- [ ] Branch protection applied per `BRANCH-PROTECTION-GUIDE.md`
- [ ] Labels created per `ISSUE-LABEL-STANDARD.md`
- [ ] Milestones / project board per `PROJECT-MANAGEMENT-PLAN.md`
- [ ] CODEOWNERS updated with Dubai handles (when known)
- [ ] Access grants per `ACCESS-CONTROL-MATRIX.md` (least privilege)

## Release

- [ ] Tag `v1.0.0-rc1` verified
- [ ] `RELEASE-MANIFEST.json` / `VERSION` verified
- [ ] `CHECKSUMS.sha256` verified on package
- [ ] GitHub Release drafted (not published) per `GITHUB-RELEASE-PLAN.md`

## Documentation

- [ ] Operator docs complete (Quick Start, Troubleshooting, Support)
- [ ] Acceptance docs complete
- [ ] Hotfix + collaboration policies linked from README

## Explicit non-actions until approval

- [ ] Do **not** push
- [ ] Do **not** invite collaborators
- [ ] Do **not** merge without review
- [ ] Do **not** publish the GitHub Release
- [ ] Do **not** enable Dependabot until approved (optional file: `.github/dependabot.yml.optional`)
