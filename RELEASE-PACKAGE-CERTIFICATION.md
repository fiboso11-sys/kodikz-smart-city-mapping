# Release Package Certification — Phase 6.4

**Date:** 2026-07-23  
**Package:** `handover/RC1-1.0.0/`

## Components verified

| Component | Result |
|-----------|--------|
| Release Manifest (`RELEASE-MANIFEST.json`) | PASS — tag `v1.0.0-rc1`, commit `8612a33f…` |
| Checksums (`CHECKSUMS.sha256`) | PASS — 82/82 match, 0 fail |
| Handover package tree | PASS |
| Deployment / Compose templates | PASS (under handover + root templates) |
| Support package (`support.sh`, OPERATOR-SUPPORT-GUIDE) | PASS |
| Plug-and-play scripts (preflight → uninstall) | PASS (22 scripts listed) |
| Operator Quick Start / Troubleshooting | PASS |
| Release certificates / notes | PASS (`RELEASE-NOTES.md`, identity files) |

## Architecture alignment

| Expectation | Manifest / VERSION |
|-------------|-------------------|
| App image | `kodikz-smart-city-app:1.0.0-rc1` |
| Worker image | `kodikz-smart-city-worker:1.0.0-rc1` |
| Schema | Postgres migration v1 |
| Git freeze | `v1.0.0-rc1` / `8612a33f…` |
| Digests | `REQUIRES_DOCKER_BUILD_HOST` (documented limitation) |

## Verdict

**RELEASE PACKAGE CERTIFIED** for GitHub publication. Docker digests remain an operator build-host action (not a Git blocker).
