# Repository Structure Review — Phase 5.8

**Release:** Version 1.0.0 RC1

## Actual layout (simplified)

```
/
├── src/                 # Canonical Next.js application
├── public/
├── scripts/             # App tooling (worker, migrate helpers)
├── deploy/              # Nginx/backup templates (repo)
├── handover/RC1-1.0.0/  # Dubai plug-and-play package (scripts, config, docs)
├── .github/             # Templates, CODEOWNERS, CI
├── docs content         # Many root-level *.md (audits + runbooks)
├── frontend/ · backend/ # Legacy (do not deploy)
├── Dockerfile · docker-compose*.yml
├── README.md · LICENSE · CHANGELOG.md · CONTRIBUTING.md · SECURITY.md
└── RELEASE-NOTES.md · KNOWN-LIMITATIONS.md · RELEASE-IDENTITY.json
```

## Expected vs actual

| Expected | Actual | Recommendation |
|----------|--------|----------------|
| `app/` | Logic under `src/app/` | Keep Next convention — **no rename** |
| `database/` | `src/lib/db/` + handover `database/` | Keep |
| `deploy/` | Present + handover `deploy/` | Keep |
| `docs/` | Mostly root `*.md` + `handover/.../docs` | Optional future `docs/` consolidation |
| `config/` | Env examples at root; handover `config/` | Keep |
| `scripts/` | Present + handover scripts | Keep |

## Decision

**Do not redesign folders for appearance.** Structure is enterprise-usable; handover package isolates Dubai operators from source navigation.
