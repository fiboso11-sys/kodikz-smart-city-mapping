# Phase 5.2 — Containerization Validation Report

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Branch:** `phase2/dubai-giscd-enhancements`  
**Date:** 2026-07-22  
**Phase type:** Release engineering — container runtime validation only  
**Constraints:** Frontend frozen · No UI/API/SGE/schema changes · No commit · No push · No deploy · No Phase 5.3  

---

## 1. Executive Summary

| Field | Evidence-based result |
|-------|------------------------|
| Docker on this host | **Unavailable** — `docker version` / `docker compose version` failed (`docker` not on PATH) |
| Runtime validation | **STOPPED** per mission rules |
| P0 (pnpm without Corepack in runner/worker) | **Remediated in source** — `Dockerfile` runner enables Corepack + prepares `pnpm@10.33.4` |
| Live build / start / health / `pnpm --version` in container | **NOT EXECUTABLE ON THIS HOST** |
| MinIO / Compose live failures | **None proven** (stack not run) |
| **FINAL DECISION** | **3. CONDITIONAL GO** |
| **Infrastructure Score** | **78 / 100** |

**RUNTIME VALIDATION NOT EXECUTABLE ON THIS HOST.**  
Static audit completed. No fabricated runtime metrics. No GO for full infrastructure pass until a Docker-capable host re-runs Part 2.

---

## 2. Root Cause Analysis

### P0 (from Phase 5.1 — verified)

| Item | Detail |
|------|--------|
| **Root Cause** | `runner` / `worker` used `CMD ["pnpm",…]` while those stages never ran `corepack enable` / `corepack prepare`. `deps`/`builder` had Corepack; runtime did not. |
| **Impact** | Containers expected to exit immediately (`pnpm: not found`). |
| **Purpose of fix** | Make pinned pnpm available on PATH in runtime images without redesigning the Dockerfile. |
| **Fix applied** | In `runner` `RUN`: `corepack enable && corepack prepare pnpm@10.33.4 --activate` (matches `package.json#packageManager`). `worker` inherits `runner`. |
| **Rollback** | Remove Corepack lines from runner `RUN`; rebuild prior image. |
| **Validation** | Requires Docker — **NOT EXECUTABLE ON THIS HOST** |

### Host limitation (this session)

| Item | Detail |
|------|--------|
| **Root Cause** | No Docker Engine / Docker Desktop CLI on the audit workstation |
| **Evidence** | PowerShell: `The term 'docker' is not recognized`; `where.exe docker` → no matches |
| **Impact** | Cannot prove image build, start, health, or in-container `pnpm --version` |

---

## 3. Dockerfile Audit (Part 1)

Classification key used everywhere below:  
**STATICALLY VERIFIED** | **RUNTIME VERIFIED** | **NOT EXECUTABLE ON THIS HOST** | **FAILED**

| Stage | Node base | Corepack | pnpm how | USER | WORKDIR | CMD | Classification |
|-------|-----------|----------|----------|------|---------|-----|----------------|
| `deps` | `node:20-bookworm-slim` | `corepack enable` then install | Via Corepack during install | root (build) | `/app` | N/A (build) | **STATICALLY VERIFIED** |
| `builder` | same | `corepack enable` then `pnpm build` | Via Corepack | root (build) | `/app` | N/A | **STATICALLY VERIFIED** |
| `runner` | same | **Enabled + prepare 10.33.4** (P0 fix) | Corepack-prepared binary for `CMD` | `kodikz` | `/app` | `["pnpm","start"]` | **STATICALLY VERIFIED** (fix present); runtime **NOT EXECUTABLE ON THIS HOST** |
| `worker` | `FROM runner` | Inherited | Inherited | `kodikz` | `/app` | `["pnpm","worker"]` | Same as runner |

| Check | Result | Class |
|-------|--------|-------|
| `packageManager` pin vs prepare | `pnpm@10.33.4` matches | **STATICALLY VERIFIED** |
| HEALTHCHECK uses Node `fetch` | Present against `/api/health` | **STATICALLY VERIFIED** |
| Non-root runtime user | `kodikz` | **STATICALLY VERIFIED** |
| COPY set (public, .next, node_modules, package.json, scripts, src, tsconfig) | Present | **STATICALLY VERIFIED** |
| In-image `pnpm --version` | Not run | **NOT EXECUTABLE ON THIS HOST** |

**No further Dockerfile redesign.**

---

## 4. Runner Validation (Part 2)

| Check | Class |
|-------|-------|
| Docker available | **FAILED** (CLI missing) → runtime suite **STOPPED** |
| Image builds | **NOT EXECUTABLE ON THIS HOST** |
| Image starts / remains running | **NOT EXECUTABLE ON THIS HOST** |
| Correct CMD / USER / WORKDIR | **STATICALLY VERIFIED** |
| Healthcheck executes successfully | **NOT EXECUTABLE ON THIS HOST** |
| `pnpm --version` inside container | **NOT EXECUTABLE ON THIS HOST** |
| Logs clean / no crash | **NOT EXECUTABLE ON THIS HOST** |

**Mark:** `RUNTIME VALIDATION NOT EXECUTABLE ON THIS HOST`

---

## 5. Worker Validation (Part 2)

| Check | Class |
|-------|-------|
| Inherits runner Corepack/pnpm | **STATICALLY VERIFIED** |
| CMD `["pnpm","worker"]` | **STATICALLY VERIFIED** |
| `tsx` available via copied `node_modules` (devDependency; full install in `deps`) | **STATICALLY VERIFIED** (install is non-`--prod`) |
| Process start / stay up | **NOT EXECUTABLE ON THIS HOST** |
| `pnpm --version` in worker container | **NOT EXECUTABLE ON THIS HOST** |

---

## 6. Compose Validation (Part 3)

| File | Static structure | Live `compose up` / `config` |
|------|------------------|------------------------------|
| `docker-compose.local.yml` | App ← Postgres healthy; MinIO present | **NOT EXECUTABLE ON THIS HOST** |
| `docker-compose.pilot.yml` | Nginx ← app; app/worker ← Postgres healthy; MinIO; env_file `.env.pilot` | **NOT EXECUTABLE ON THIS HOST** |
| `docker-compose.production-template.yml` | App + worker; external deps | **NOT EXECUTABLE ON THIS HOST** |
| `docker-compose.municipality-template.yml` | Same pattern | **NOT EXECUTABLE ON THIS HOST** |

| Item | Finding | Class |
|------|---------|-------|
| `depends_on` / restart policies | Present and coherent in YAML | **STATICALLY VERIFIED** |
| Postgres healthcheck | `pg_isready` in local/pilot | **STATICALLY VERIFIED** |
| App healthcheck (pilot) | readiness fetch | **STATICALLY VERIFIED** |
| Verified compose runtime failure | None (not run) | — |
| Speculative MinIO race | Not proven | No code change |

---

## 7. MinIO Validation (Part 4)

| Check | Class |
|-------|-------|
| Healthcheck in Compose | Absent (static observation) — **STATICALLY VERIFIED** as *missing* |
| Proven startup race | **NOT EXECUTABLE ON THIS HOST** — no implementation |
| Bucket init job | Not in Compose — **STATICALLY VERIFIED** as *absent*; not proven required |

**Action taken:** none (no proven failure).

---

## 8. Postgres & Backup Validation (Parts 5)

| Asset | Review | Class |
|-------|--------|-------|
| `pnpm migrate:pg` / `migratePostgres()` | Present in repo | **STATICALLY VERIFIED** |
| `deploy/backup/pg-backup.sh` | `set -euo pipefail`; requires `DATABASE_URL`; custom dump + sha256 | **STATICALLY VERIFIED** |
| `deploy/backup/pg-restore.sh` | Warning; `--clean --if-exists`; count query | **STATICALLY VERIFIED** |
| Live migrate / backup / restore | Not run | **NOT EXECUTABLE ON THIS HOST** |
| Script redesign | Not done | — |

---

## 9. Container Security Review (Part 6)

| Control | Assessment | Class |
|---------|------------|-------|
| Runtime user non-root (`kodikz`) | Acceptable for internal pilot | **STATICALLY VERIFIED** |
| Root only during image `RUN` | Expected | **STATICALLY VERIFIED** |
| Secrets via env_file (not in image) | `.dockerignore` excludes `.env*` | **STATICALLY VERIFIED** |
| Privileged mode / host mounts beyond certs/config | Not declared in Compose YAML | **STATICALLY VERIFIED** |
| Runtime privilege probe | — | **NOT EXECUTABLE ON THIS HOST** |
| Dependency CVE scan in image | — | **NOT EXECUTABLE ON THIS HOST** (host `pnpm audit` from 5.1 remains separate) |

**Internal pilot security (static):** acceptable pending TLS + secret rotation on pilot VPS (ops, from 5.1).

---

## 10. Build Reproducibility & Metrics (Part 7)

### When Docker exists — required collection

*Not collected — Docker absent.*

### Recorded without fabrication

| Metric | Value | Class |
|--------|-------|-------|
| Target Node image | `node:20-bookworm-slim` | **STATICALLY VERIFIED** |
| pnpm pin | `10.33.4` | **STATICALLY VERIFIED** |
| Image digest | — | **NOT EXECUTABLE ON THIS HOST** |
| Build duration | — | **NOT EXECUTABLE ON THIS HOST** |
| Image size | — | **NOT EXECUTABLE ON THIS HOST** |
| Startup duration | — | **NOT EXECUTABLE ON THIS HOST** |
| Memory / CPU | — | **NOT EXECUTABLE ON THIS HOST** |
| Container logs / health | — | **NOT EXECUTABLE ON THIS HOST** |

**EXTERNAL VALIDATION REQUIRED** on a Docker-capable host (pilot VPS or Docker Desktop).

---

## 11. Classification Summary

| Area | Classification |
|------|----------------|
| Docker CLI present | **FAILED** |
| P0 Dockerfile Corepack fix in source | **STATICALLY VERIFIED** |
| Runner/worker CMD + USER + HEALTHCHECK definition | **STATICALLY VERIFIED** |
| Compose YAML coherence | **STATICALLY VERIFIED** |
| Backup/restore script syntax | **STATICALLY VERIFIED** |
| Any image build/start/health/`pnpm --version` | **NOT EXECUTABLE ON THIS HOST** |
| MinIO race as runtime failure | **NOT EXECUTABLE ON THIS HOST** (not FAILED) |
| Invented runtime PASS | **Not issued** |

---

## 12. Files Modified

| File | Change |
|------|--------|
| `Dockerfile` | Runner: `corepack enable` + `corepack prepare pnpm@10.33.4 --activate` before `USER kodikz` |

| Field | Content |
|-------|---------|
| Root Cause | Runtime `pnpm` CMD without Corepack |
| Purpose | Minimal PATH fix for runner/worker |
| Rollback | Revert those two Corepack commands |
| Validation | Pending Docker host |
| Documentation | This report |

*(Fix was applied in the prior 5.2 pass; still present and confirmed this session. No additional edits required this pass.)*

---

## 13. Regression Validation

| Area | Result |
|------|--------|
| Frontend / business logic / API / SGE / schema | **Unchanged** |
| Compose / Nginx / backup scripts | **Unchanged** |
| Speculative MinIO changes | **Not applied** |

---

## 14. Risk Matrix

| Risk | Severity | Notes |
|------|----------|-------|
| Unproven container start on real Docker | **High** until EXTERNAL VALIDATION | Blocks full INFRASTRUCTURE READY |
| TLS / `.env.pilot` missing on pilot host | High (ops) | From 5.1; not a Dockerfile defect |
| MinIO readiness race | Medium (theoretical) | Implement only if observed |
| Backup drill unproven | Medium | Phase 5.6 |

---

## 15. Known Limitations

1. This audit host cannot run Docker.  
2. Runtime quality gate items remain open until EXTERNAL VALIDATION.  
3. Score must not be inflated to “READY” without image proofs.  
4. Frontend remains frozen; Phase 5.3 not started.

---

## 16. Infrastructure Score

| Prior | Change | Current |
|-------|--------|---------|
| 74 (5.1) | +4 for P0 **source** remediation | **78 / 100** |

Not increased further: runtime proofs absent.

---

## 17. Quality Gate (honest)

| Gate | Status |
|------|--------|
| Docker images build | **NOT PROVEN** |
| Runtime containers start | **NOT PROVEN** |
| Corepack enabled (source) | **YES** |
| pnpm executable in container | **NOT PROVEN** |
| Healthchecks pass | **NOT PROVEN** |
| Compose validates (live) | **NOT PROVEN** |
| Runtime logs clean | **NOT PROVEN** |
| No crash / missing dep | **NOT PROVEN** for runtime |

Per mission: Docker unavailable → **do not issue GO** → issue **CONDITIONAL GO**.

---

## 18. FINAL DECISION

# **3. CONDITIONAL GO**

**(Runtime validation could not be completed because Docker was unavailable.)**

**Why this option (not 1, 2, or 4):**

| Option | Why not / why yes |
|--------|-------------------|
| 1. INFRASTRUCTURE READY | Runtime gates unproven — would fabricate success |
| 2. READY WITH MINOR ACTIONS | Implies remaining actions are minor *and* runtime is largely known; here the **entire runtime suite** is blocked by host tooling |
| **3. CONDITIONAL GO** | **Correct:** P0 fixed in source; static audit clean; **explicit** that Docker absence blocks certification |
| 4. NO-GO | Reserved for failed builds/starts or unfixed critical defects; P0 is fixed in source and Docker absence is environmental, not an unfixed product defect |

**Path to Option 1:** On a Docker host, execute EXTERNAL VALIDATION checklist, then re-score.

### EXTERNAL VALIDATION checklist (for pilot VPS / Docker Desktop)

```text
docker version
docker compose version
docker build --target runner -t kodikz-app:rc1 .
docker build --target worker -t kodikz-worker:rc1 .
docker run --rm kodikz-app:rc1 pnpm --version
docker run --rm kodikz-worker:rc1 pnpm --version
# then start with valid env; confirm health / readiness; record digest, size, startup, memory
```

---

## STOP

- No deploy · No commit · No push · No merge · No tags · No Phase 5.3  
- Awaiting approval  

*End of Phase 5.2 Infrastructure Validation Report.*
