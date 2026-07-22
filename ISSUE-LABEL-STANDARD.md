# Issue Label Standard

Create these labels in GitHub (**Settings → Labels**) before inviting Dubai collaborators.

| Label | Color (suggested) | Purpose |
|-------|-------------------|---------|
| `bug` | `#d73a4a` | Defect |
| `critical` | `#b60205` | Pilot-blocking / security |
| `pilot` | `#0e8a16` | Pilot operations context |
| `deployment` | `#1d76db` | Deploy/package/scripts |
| `documentation` | `#0075ca` | Docs only |
| `security` | `#ee0701` | Security (prefer private channel first) |
| `hotfix` | `#e99695` | RC1 hotfix track |
| `enhancement` | `#a2eeef` | Future features (not RC1 freeze) |
| `question` | `#d876e3` | Clarification |
| `blocked` | `#ffffff` | Waiting on dependency |
| `dependencies` | `#0366d6` | Dependabot (if enabled) |

## Usage rules

- P0/P1 → `critical` + `hotfix` + `pilot`
- Deploy package issues → `deployment`
- Never paste secrets in issues
