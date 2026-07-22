# Security Certification — RC1 1.0.0

| Check | Result |
|-------|--------|
| `.env` / `.env.pilot` in tree | **Absent** |
| `.env.local` | Local only · **gitignored** |
| Tracked `*.pem` / keys | **None** (`git ls-files`) |
| Env templates | Placeholders `CHANGE_ME` / `REPLACE_*` only |
| `docker-compose.local.yml` minioadmin | Local-dev only — not for pilot |
| Debug endpoints | No open unauthenticated debug admin API found in audit scope |
| Pilot defaults | `MOCK_AUTH_ENABLED=false` required; JWT secret min length enforced |
| Seed password | Must rotate — documented limitation |

## Verdict

**PASS** for repository secret hygiene. Operational credential rotation remains a go-live action.
