# Changelog

All notable changes to this project are documented for release collaboration.

Format follows a Keep-a-Changelog style. Version **1.0.0 RC1** is the current frozen pilot line.

## [1.0.0-rc1] — 2026-07-22

### Added

- Survey Guidance Engine, Driver Copilot, Supervisor Command Center
- Assignment lifecycle APIs and persistence (PostgreSQL schema v1)
- Auth (local JWT pilot) + RBAC
- Object storage (S3/MinIO) integration
- Plug-and-play deployment package under `handover/RC1-1.0.0/`
- Enterprise operations: release identity, system health, About/Version, `support.sh`
- Dubai operator docs: Quick Start, Troubleshooting, Support Guide, Acceptance Checklist

### Changed

- Canonical container image name: `kodikz-smart-city-app:1.0.0-rc1`

### Security

- Non-root app user in Docker image; env examples only (no production secrets in Git)

### Known limitations

See `KNOWN-LIMITATIONS.md` and `handover/RC1-1.0.0/documentation/KNOWN-LIMITATIONS.md`.

## [Unreleased]

### Repository

- Removed obsolete tracked `frontend/` and `backend/` copies from Git (Phase 6.2); RC1 app remains root Next.js + `src/`
- Added legacy cleanup evidence and GitHub publication readiness certification (Phase 6.3–6.4)

Post-RC1 product features/UI enhancements remain deferred until after pilot acceptance unless classified as an approved hotfix.

---

Tag: `v1.0.0-rc1` · Freeze commit: `8612a33f03db738cffc0bfd6bd089abe3f8fd414`
