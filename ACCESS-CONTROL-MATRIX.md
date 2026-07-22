# Access Control Matrix — GitHub

**Do not invite collaborators until Release Manager approval.**

| Role | Suggested GitHub permission | Typical identity |
|------|----------------------------|------------------|
| Kodikz Release Manager | **Admin** | Freeze, tags, protection, invites |
| Kodikz Maintainers | **Maintain** | Merge to protected branches, manage issues |
| Developers (Kodikz) | **Write** | Branches, PRs, CI |
| QA | **Triage** or Write | Issues, PR comments, labels |
| Dubai Technical Lead | **Write** or **Maintain** (agreed) | Deploy docs PRs, pilot issues |
| Dubai operators / stakeholders | **Read** + Issues | View code/docs; file issues (no push) |

## Permission meanings

| Permission | Capabilities (summary) |
|------------|------------------------|
| Admin | Full settings, secrets, protection, people |
| Maintain | Manage issues/PRs without full admin |
| Write | Push non-protected branches, open PRs |
| Triage | Manage issues/PRs without write to code |
| Read | Clone and view |

## Rules

- Prefer least privilege
- Dubai does not need Admin for pilot
- CODEOWNERS: keep `@fiboso11-sys`; add Dubai handles when provided
- Repository secrets (if any) stay Kodikz-only unless explicitly shared
