# RC1 1.0.0 Handover Package

**Tag:** `v1.0.0-rc1`
**Commit:** `8612a33f03db738cffc0bfd6bd089abe3f8fd414`
**Branch:** `phase2/dubai-giscd-enhancements`
**Frozen:** 2026-07-22

## Contents

| Folder | Contents |
|--------|----------|
| `documentation/` | Release notes, runbooks, acceptance, API, DB, env matrix |
| `deployment/` | Dockerfile, Compose templates, `deploy/nginx`, `deploy/backup` |
| `environment/` | `*.example` env templates only (no secrets) |
| `application-pointer/` | How to obtain the application source |

## Application source

The full application (frontend + backend + migrations + tests) is the Git tree at tag `v1.0.0-rc1`.

`ash
git fetch --tags
git checkout v1.0.0-rc1
`

Or archive: `git archive --format=zip -o kodikz-rc1-1.0.0.zip v1.0.0-rc1`

## Dubai next steps

1. Follow `documentation/DUBAI-DEPLOYMENT-RUNBOOK.md`
2. Complete `documentation/DUBAI-SERVER-RUNTIME-VALIDATION-CHECKLIST.md`
3. Sign `documentation/PILOT-HANDOVER-ACCEPTANCE-CHECKLIST.md`

**Do not** commit real `.env.pilot` files into Git.
