# Phase 5.6 — Plug-and-Play Deployment Readiness

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Release:** RC1 1.0.0 (`v1.0.0-rc1` @ `8612a33f03db738cffc0bfd6bd089abe3f8fd414`)  
**Date:** 2026-07-22  
**Scope:** Package preparation only — **no Dubai server access, no live deploy**

---

## Executive Summary

Phase 5.6 delivers a self-contained operator package under `handover/RC1-1.0.0/` with the required one-command workflow (`preflight` → `configure` → `deploy` → `validate`) plus operational scripts for status, logs, backup, restore, update, rollback, and uninstall.

Docker images are **not** built on the packaging workstation (Docker Engine absent). Image build/export scripts are ready and marked **REQUIRES DOCKER BUILD HOST**. Runtime PASS/FAIL on Dubai is marked **REQUIRES DUBAI SERVER VALIDATION** — not fabricated.

## Target Operator Workflow

1. Transfer `handover/RC1-1.0.0/` (+ offline image tar when available)  
2. `./scripts/preflight.sh`  
3. `./scripts/configure.sh` (+ `validate-config.sh`)  
4. `./scripts/deploy.sh`  
5. `./scripts/validate.sh`  
6. Receive PASS / WARNINGS / FAILED report under `reports/`

## Package Inventory

| Item | Status |
|------|--------|
| `images/` `app/` `database/` `deploy/` `config/` `scripts/` `docs/` `logs/` | Present |
| `VERSION` `CHECKSUMS.sha256` `RELEASE-MANIFEST.json` `RELEASE-NOTES.md` `README.md` | Present |
| Operator scripts (preflight→uninstall + DB helpers) | Present |
| QUICK-START / TROUBLESHOOTING / security / acceptance | Present |
| Offline image tar | **Absent** — REQUIRES DOCKER BUILD HOST |

## Release Artifact Model

Documented in `handover/RC1-1.0.0/RELEASE-ARTIFACT-STRATEGY.md`.

- Immutable tags: `kodikz-smart-city-frontend|backend|worker:1.0.0-rc1`  
- Frontend tag is an **alias** of the unified Next.js runner (same digest as backend)  
- Registry primary; `docker save` offline fallback  
- No `:latest` for app/worker  

## Preflight Readiness

`scripts/preflight.sh` checks OS/Ubuntu, CPU/RAM/disk (from Dubai infra mins), Docker, Compose, daemon, utilities, ports, conflicts, DNS, time sync, write access, package files, offline/registry mode. Emits `reports/preflight-report.json` + `PREFLIGHT-REPORT.md`. FAIL blocks deploy.

## Configuration Readiness

`configure.sh` + `validate-config.sh` + `config/deployment-values.example`. Writes `config/.env.production` mode **600**. Rejects placeholder/default secrets. Never prints passwords.

## Deployment Automation

`deploy.sh` follows the required 18-step order, confirms before replacing existing installs, takes backup first, does not auto-destroy volumes, writes deployment reports.

## Database Automation

`migrate.sh` · `migration-status.sh` · `rollback-database.sh` (directs to restore; no invented down-migration) · `load-demo-data.sh` (refuses production demo load). Reference RBAC/tenant seed only via app migrate — **no demo auto-load**.

## Validation Automation

`validate.sh` classifies PASS / WARNING / FAIL / NOT APPLICABLE and ends with exactly one of:

- `DEPLOYMENT VALIDATED`  
- `DEPLOYMENT VALIDATED WITH WARNINGS`  
- `DEPLOYMENT FAILED`  

Restart-persistence deep test is explicitly **NOT APPLICABLE** unless exercised on host.

## Backup and Restore

`backup.sh` / `restore.sh` cover Postgres, MinIO best-effort, redacted + secret config snapshots (600), version/migration markers, checksums, confirmation on restore. Not executed live in this phase (no Dubai runtime).

## Update and Rollback

`update.sh` / `rollback.sh` retain known-good metadata/images; do not auto-delete previous release.

## Security Review

See `PLUG-AND-PLAY-SECURITY-AUDIT.md`. Non-root app user, no privileged/socket mounts, DB not published, secrets permissioned, placeholders rejected.

## Documentation Review

QUICK-START (≤2 pages target), TROUBLESHOOTING (symptom/cause/diag/action/escalation), acceptance checklist Stages A–G, artifact strategy, package README.

## Verified Blockers

| Blocker | Classification |
|---------|----------------|
| No Docker on packaging host → no image digests/tar | **REQUIRES DOCKER BUILD HOST** (not a Dubai defect) |
| No Dubai server access → no live validation | **REQUIRES DUBAI SERVER VALIDATION** (not a software defect) |
| GPS/Mongo external | By design — connectivity validated when network allows |

## Dubai-Team Inputs Required

- Provisioned Ubuntu host meeting infra minimums  
- DNS + TLS materials  
- Customer secrets (DB, JWT, object storage, admin email)  
- Firewall/outbound to GPS backend  
- Execution of Stages A–E on the acceptance checklist  

## Known Limitations

- Unified FE/API image (frontend tag is alias) — documented honestly  
- RC1 single forward migration; rollback via backup restore  
- Mongo not in Compose  
- Nginx pilot template assumes cert files for TLS mode  
- Checksums cover package files at packaging time; regenerate after image tar is added  

## Plug-and-Play Readiness Score

**86 / 100**

Deductions: missing built offline images/digests (−10), unexecuted runtime validation (−4).

## Quality Gates

| Gate | Result |
|------|--------|
| One-command preflight | ✓ |
| Guided + validated configuration | ✓ |
| One-command deploy | ✓ |
| One-command runtime validation | ✓ |
| Status / logs / backup / restore / update / rollback | ✓ |
| No real secrets | ✓ |
| Demo not auto-loaded | ✓ |
| Version + checksums | ✓ |
| Fail-fast non-zero exits | ✓ (scripted) |
| Immutable tags | ✓ |
| Data protected (no silent wipe) | ✓ |
| Operator docs | ✓ |
| Runtime not falsely claimed | ✓ |
| Dubai server not accessed | ✓ |

---

## FINAL DECISION

### 2. READY WITH MINOR ACTIONS

**Minor actions (Kodikz before physical handover):**

1. Run `./scripts/build-images.sh` on a Docker build host  
2. Place `images/kodikz-rc1-1.0.0-rc1-images.tar` (+ sha256) into the package  
3. Regenerate `CHECKSUMS.sha256` / refresh digests in `VERSION` + `RELEASE-MANIFEST.json`  
4. Optional: push immutable tags to the agreed registry  

**Dubai actions (not software defects):** Stages A–E on the acceptance checklist · **REQUIRES DUBAI SERVER VALIDATION**.

---

*End of Phase 5.6 readiness report. Awaiting review — no push/tag/deploy without approval.*
