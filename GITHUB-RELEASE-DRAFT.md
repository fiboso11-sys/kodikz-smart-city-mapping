# GitHub Release Draft — DO NOT PUBLISH

**Prepared:** 2026-07-23  
**Tag:** `v1.0.0-rc1` (already exists — do not recreate or move without Release Manager approval)  
**Title:** RC1 Version 1.0.0

---

## Executive Summary

Kodikz Smart City Mapping & Survey Guidance Platform **RC1 Version 1.0.0** is the frozen internal pilot release for Dubai Municipality GISCD. Application survey workflows are frozen. Dubai owns infrastructure (VPS, Docker, DNS, TLS). Kodikz delivers the application package, plug-and-play operators scripts, and support tooling.

## What's Included

- Full-stack survey + GIS monitoring application (Next.js)
- PostgreSQL schema v1 + migration tooling
- Plug-and-play package: `handover/RC1-1.0.0/`
- Operator commands: preflight → configure → deploy → validate
- Ops: status, logs, backup, restore, update, rollback, support bundle
- Release identity / System Health / About surfaces
- Documentation, acceptance checklist, hotfix policy

## Known Limitations

See `KNOWN-LIMITATIONS.md` and `handover/RC1-1.0.0/documentation/KNOWN-LIMITATIONS.md`.

Notable:

- Offline/canonical image digests: **REQUIRES DOCKER BUILD HOST**
- Dubai runtime validation: **REQUIRES DUBAI SERVER VALIDATION**
- GPS/Mongo remain external
- Canonical image: `kodikz-smart-city-app:1.0.0-rc1`

## Deployment Package

Path: `handover/RC1-1.0.0/`  
Start: `QUICK-START.md`

## Support Package

- `OPERATOR-SUPPORT-GUIDE.md`
- `./scripts/support.sh` (sanitized bundles)
- `RC1-HOTFIX-POLICY.md`
- `PILOT-SUPPORT-PLAN.md`

## Checksums

`handover/RC1-1.0.0/CHECKSUMS.sha256`  
`handover/RC1-1.0.0/RELEASE-MANIFEST.json`

## Documentation Links

- Release notes: `RELEASE-NOTES.md`
- Changelog: `CHANGELOG.md`
- Collaboration: `COLLABORATION-POLICY.md`
- Security: `SECURITY.md`

## Pilot Scope

Internal pilot only. No new features on frozen RC1 without Product approval. Hotfixes limited to approved P0/P1 classes.

## Support Contact

Fill contacts in Pilot Support Plan before invite. Security: private channel per `SECURITY.md` — do not file public exploitable issues.

---

**Publish gate:** working tree clean · Release Manager approval · preferred order in `POST-RELEASE-EXECUTION-PLAN.md`
