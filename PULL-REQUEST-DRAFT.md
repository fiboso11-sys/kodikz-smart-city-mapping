# Pull Request Draft — RC1 Publication Line (Final)

**Base (suggested):** RM-designated protected branch (e.g. `release/dubai-giscd-phase1-rc` or future `main`)  
**Head:** `phase2/dubai-giscd-enhancements`  
**Title:** `RC1 1.0.0 — Survey Guidance platform, handover package, and legacy cleanup`

---

## Executive Summary

Publishes the RC1 1.0.0 collaboration line for **Kodikz Smart City Mapping & Survey Guidance Platform**: Survey Guidance Engine, Driver Copilot, Supervisor workflows, PostgreSQL schema v1, Docker/handover packaging, enterprise operations support, GitHub collaboration standards, and Git-managed removal of obsolete nested `frontend/` / `backend/` copies. Live GPS remains the **Dubai-managed VPS**.

## Repository evolution

- Canonical app: **root Next.js** + `src/`
- Freeze tag (immutable): `v1.0.0-rc1` → `8612a33f03db738cffc0bfd6bd089abe3f8fd414`
- Handover: `handover/RC1-1.0.0/`
- Ops identity / health / support scripts
- Collaboration: SECURITY, CHANGELOG, templates, policies

## Legacy cleanup

- Tracked removal: commit `4f6886d` (98 files)
- Evidence: commit `9945f4e`
- Local backup branch: `backup/pre-legacy-cleanup` @ `615609e` (do not delete)

## Release engineering

- Plug-and-play scripts, Compose templates, checksums, acceptance checklist
- Image names: `kodikz-smart-city-app:1.0.0-rc1`, worker counterpart
- Digests: require Docker build host

## Operations support

- Operator Quick Start, Troubleshooting, Support Guide
- `support.sh` / sanitize diagnostics
- About / version / release-identity APIs

## GitHub standards

- SECURITY.md, CODE_OF_CONDUCT, issue/PR templates, CODEOWNERS
- Publication plan and release checklist prepared (execution after RM approval)

## Quality gates

| Gate | Result |
|------|--------|
| Type-check / Lint | PASS |
| Production build | PASS |
| Checksums | PASS (82/82) |
| Secret scan | PASS |
| Docs / structure / package | PASS |

## Known limitations

See `KNOWN-LIMITATIONS.md` — Docker digests, Dubai runtime ownership, seeded auth rotation, SSE nginx buffering, etc.

## Docker build-host requirement

Image digests and `build-images.sh` require a Linux Docker host. A Windows workstation without Docker cannot substitute for Dubai runtime certification.

## Dubai deployment responsibility

VPS provisioning, TLS, DNS, firewall, Compose bring-up, and pilot acceptance are owned by the Dubai Infrastructure Team. This PR delivers application + documentation package only.
