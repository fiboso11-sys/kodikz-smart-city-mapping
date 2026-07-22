# .gitignore Audit — Phase 5.8

| Pattern / area | Required | Status |
|----------------|----------|--------|
| `node_modules` | Yes | PASS |
| `.next` (+ release dist dirs) | Yes | PASS |
| `.env*` with example exceptions | Yes | PASS |
| logs (`*.log`, handover logs) | Yes | PASS |
| backups / `data/` | Yes | PASS |
| support bundles | Yes | PASS |
| Docker volume data paths | Yes | PASS |
| certificates `*.pem` `*.key` `*.crt` | Yes | PASS |
| `*.zip` `*.tar.gz` / image tars | Yes | PASS |
| `coverage` `dist` `tmp` | Yes | PASS |

## Tracked files that must remain

- `.env*.example` and handover environment examples
- Source, docs, handover scripts (not secrets)
- `CHECKSUMS.sha256`, `VERSION`, manifests

## Action

Strengthened `.gitignore` in Phase 5.8. Re-verify with `git status` before any invite that no ignored secrets are staged.
