# Operator Support Guide — RC1

**Audience:** Dubai Infrastructure / Pilot operators  
**Product:** Kodikz Smart City Mapping & Survey Guidance Platform `1.0.0` / RC1 / `v1.0.0-rc1`

## Identify the release

- UI: **Settings → About / Version**
- UI: **Settings → System Health**
- API: `/api/release-identity`, `/api/system-health`
- Host: `./scripts/status.sh`

## Issue workflow

1. Record the problem (what failed, screens/URL)
2. Record date/time (Asia/Dubai or UTC — state which)
3. Record affected user/vehicle/tenant **without** unnecessary personal data
4. Run `./scripts/status.sh`
5. Run `./scripts/support.sh`
6. Send `support-bundles/kodikz-support-bundle-*.tar.gz` on the **secure channel** agreed with Kodikz (not public email if policy forbids)
7. Kodikz reviews diagnostics
8. Kodikz classifies the issue
9. P0/P1 defects follow `RC1-HOTFIX-POLICY.md`
10. Infrastructure issues remain with Dubai server team
11. Feature requests → future release

## Severity (internal recommendations — not contractual SLA)

| Code | Meaning |
|------|---------|
| P0 | Pilot unavailable or data integrity risk |
| P1 | Critical workflow blocked |
| P2 | Major degraded functionality |
| P3 | Minor issue |
| P4 | Enhancement |

Suggested internal response targets: P0 same business day acknowledgment · P1 next business day · P2/P3 planned · P4 backlog.

## Support bundle rules

- Sanitized automatically
- Logs: last 30 minutes, ≤2000 lines/service (see `LOG-COLLECTION-POLICY.md`)
- Permissions: `600`
- Never put secrets in chat tickets

## Related docs

`QUICK-START.md` · `TROUBLESHOOTING.md` · `DIAGNOSTIC-SANITIZATION-STANDARD.md` · `PILOT-SUPPORT-PLAN.md`
