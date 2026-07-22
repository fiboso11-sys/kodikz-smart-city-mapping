# Security Policy

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Release:** Version **1.0.0 RC1** (`v1.0.0-rc1`)

## Supported versions

| Version | Support |
|---------|---------|
| 1.0.0 RC1 | Active pilot support (hotfixes per `RC1-HOTFIX-POLICY.md`) |
| Pre-RC1 / experimental | Best effort only |

## Reporting a vulnerability

Do **not** open a public GitHub issue for security findings that could enable exploitation.

1. Contact the Kodikz Release Manager via the private channel listed in `PILOT-SUPPORT-PLAN.md` / `handover/RC1-1.0.0/OPERATOR-SUPPORT-GUIDE.md`
2. Include: affected version/tag, environment (pilot/local), reproduction steps, impact, and a sanitized support bundle if relevant (`./scripts/support.sh`)
3. Allow reasonable time for triage before any disclosure

## Secrets and credentials

- Never commit `.env`, keys, certificates, or support bundles
- Rotate any credential that may have been exposed
- Use Dubai-managed secret stores for pilot/production values

## Scope

In scope: authentication/authorization defects, data integrity risks, secret leakage, remote code execution in the application package.  
Out of scope (Dubai-owned): VPS OS hardening, firewall, DNS, TLS issuance, infrastructure monitoring — report those to the Dubai Infrastructure Team.
