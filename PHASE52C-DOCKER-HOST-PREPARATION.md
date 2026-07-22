# Phase 5.2C — Docker Host Preparation

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Date:** 2026-07-22  
**Prior:** Phase 5.2B **NO-GO** — Docker not installed on audit workstation  
**Scope:** Environment readiness only · No app containers · No deploy · No infra code changes · No Phase 5.2B until host certified  

---

## 1. Executive Summary

This workstation (**ISMDELL**, Dell Inspiron 15 3520, Windows 11 Home Single Language) **cannot currently run Phase 5.2B**. Docker Desktop is not installed, WSL is not installed, and available RAM (~7.7 GB total, &lt;1 GB free at probe) is **marginal** for Docker Desktop plus the full pilot Compose stack.

**Recommended runtime host:** **Option C — Pilot VPS (Ubuntu Server LTS)** per existing `PHASE24-PILOT-SERVER-REQUIREMENTS.md`.

| Field | Value |
|-------|--------|
| **FINAL DECISION** | **3. USE A DIFFERENT HOST** |
| **Go / No-Go for Runtime Certification on this PC** | **NO-GO** |
| **Installation performed this phase** | **None** (no Docker/WSL install; no infrastructure modification) |

---

## 2. Host Assessment — Option Comparison

| Criterion | A. Current Windows laptop | B. Dedicated Docker workstation | C. Pilot VPS | D. Production-like VM |
|-----------|---------------------------|----------------------------------|--------------|------------------------|
| **CPU** | i5-1235U · 10c/12t — OK for light Docker | Configurable — good | 4–8 vCPU (spec) — **good** | Configurable — good |
| **RAM** | **7.69 GB** — tight for Desktop + PG + MinIO + app + worker + Nginx | Prefer ≥16 GB | **8–16 GB** required — **good** | Prefer ≥16 GB |
| **Storage** | C: 237 GB · **~56 GB free** — tight for images/layers | Prefer ≥200 GB free | **150–250 GB SSD** — **good** | Prefer ≥150 GB |
| **Docker compatibility** | Desktop via **WSL2** (Home-supported) | Native / Desktop | Native Engine — **best** | Nested virt depends on hypervisor |
| **WSL2** | **Not installed** | Usually available | N/A (Linux) | If Windows guest |
| **Hyper-V** | Full Hyper-V **not** on Home; Desktop uses WSL2 | Often available on Pro | N/A | Depends |
| **Network** | Dev laptop NAT — OK for lab | Lab/corp | **Static IP / DNS / TLS** — **pilot-aligned** | Controllable |
| **Reliability** | Sleep/suspend (seen in soak gaps) | Better if always-on | **Always-on** — **best** | Good if pinned |
| **Security** | Personal Home SKU · shared desktop | Hardenable | **Firewall + private Docker net** — **best** | Hardenable |
| **Fits Dubai internal pilot** | Dev-only smoke | Possible | **Yes — intended** | Pre-prod staging |
| **Recommendation rank** | 3rd (smoke only after heavy setup) | 2nd | **1st** | 2nd (if VPS delayed) |

### Evidence — Option A (this host)

| Check | Result |
|-------|--------|
| OS | Windows 11 Home Single Language · Build **26200** · EditionID `CoreSingleLanguage` |
| Hardware | Dell Inspiron 15 3520 |
| RAM | 7.69 GB total · **0.43 GB free** at probe |
| Disk C: | 237.6 GB · **56 GB free** |
| Hypervisor present | **True** (VBS / hypervisor detected) |
| WSL | **Not installed** (`wsl --install` prompted) |
| Docker Desktop | **Not installed** (no Program Files / LocalAppData paths; winget package exists in catalog but not installed) |
| Optional feature query | Requires **elevation** (admin) — not changed this phase |
| CPU virt flags via WMI | Reported False while hypervisor present — consistent with “hypervisor already running” masking (systeminfo: Hyper-V requirements not displayed) |

### Docker Desktop on Windows 11 Home

| Question | Answer |
|----------|--------|
| Supported? | **Yes** — Docker Desktop supports Windows Home via **WSL2** backend (does **not** require Hyper-V Server role) |
| Prerequisites | WSL2 + Virtual Machine Platform; reboot; sufficient RAM/disk; admin install |
| Why not ready now? | WSL **missing**; Docker **missing**; RAM headroom **insufficient** for reliable full-stack certification |

---

## 3. Environment Readiness

| Prerequisite | Status on ISMDELL |
|--------------|-------------------|
| Virtualization capable | Likely yes (hypervisor present / VBS running) |
| BIOS virt | Not independently readable without elevation; hypervisor already active |
| WSL2 | **Missing** |
| Virtual Machine Platform | **Unknown** (needs admin `Get-WindowsOptionalFeature`) — treat as **to enable** with WSL install |
| Hyper-V (full) | **N/A / unavailable** on Home — not required for Docker Desktop |
| Docker Engine / Compose | **Missing** |
| Hello-world capable today | **No** |

---

## 4. Installation Status

| Action | Status |
|--------|--------|
| Docker Desktop install | **Not performed** (phase forbids infra modification / premature 5.2B) |
| WSL install | **Not performed** |
| Hello-world / network / volume tests | **Not performed** |

### If Option A is forced later (reference steps only — do not run until approved)

**Admin PowerShell:**

```powershell
# 1) Install WSL2 + default Ubuntu
wsl --install

# 2) Reboot, then confirm
wsl --status
wsl --list --verbose

# 3) Install Docker Desktop (winget)
winget install --id Docker.DockerDesktop -e

# 4) Start Docker Desktop → Settings: Use WSL 2 based engine; allocate RAM carefully (leave ≥2–3 GB for Windows)

# 5) Host certification only (NOT app stack)
docker version
docker compose version
docker pull hello-world
docker run --rm hello-world
docker network create kodikz-hostcheck
docker volume create kodikz-hostcheck
docker network rm kodikz-hostcheck
docker volume rm kodikz-hostcheck
```

**Then** re-enter Phase 5.2B — still prefer VPS for full pilot Compose (Nginx+App+Worker+Postgres+MinIO).

### Option C — Pilot VPS (recommended)

Align with existing requirements:

| Spec | Minimum | Preferred |
|------|---------|-----------|
| vCPU | 4 | 8 |
| RAM | 8 GB | 16 GB |
| Disk | 150 GB SSD | 250 GB+ |
| OS | Ubuntu Server LTS | Ubuntu Server LTS |
| Soft | Docker Engine + Compose plugin | Same + firewall |

```bash
# On Ubuntu (example — execute on VPS by ops)
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
# Install Docker Engine per docs.docker.com/engine/install/ubuntu/
docker version
docker compose version
docker run --rm hello-world
```

GPS backend remains on existing GPS VPS (unchanged architecture).

---

## 5. Missing Prerequisites (this laptop)

1. **WSL2** not installed  
2. **Docker Desktop / Engine** not installed  
3. **Admin elevation** required to enable Windows features  
4. **RAM headroom** inadequate for reliable full-stack runtime certification  
5. **Disk free (~56 GB)** risk for multiple image builds + volumes  
6. Laptop **sleep/suspend** historically interfered with soak probes  

---

## 6. Recommended Host

### Primary: **Option C — Pilot VPS (Ubuntu)**

**Why:** Matches documented pilot architecture, always-on, adequate RAM/disk targets, native Docker Engine (no WSL layer), appropriate security boundary for Dubai internal pilot certification.

### Secondary: **Option D or B** if VPS delayed

Production-like VM or dedicated workstation with ≥16 GB RAM, Ubuntu preferred.

### Not recommended for 5.2B full certification: **Option A alone**

May be used later for **host smoke** (hello-world) after WSL+Docker Desktop, not as the certification authority for Infrastructure Ready.

---

## 7. Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Certifying on 8 GB Windows Home laptop | **High** | Use Pilot VPS |
| Installing Docker on Home without WSL | **High** (will fail) | Install WSL2 first if Option A |
| Nested virt / VBS conflicts | Medium | Prefer Linux VPS |
| Proceeding to 5.2B on this host now | **Critical** (will NO-GO again) | Stop until different host ready |
| Delaying VPS | Medium | Option B/D interim |

---

## 8. Go / No-Go for Runtime Certification

| Host | Verdict |
|------|---------|
| **ISMDELL (current)** | **NO-GO** for Phase 5.2B |
| **Pilot VPS (not yet provisioned here)** | **GO candidate** once Docker Engine + Compose + hello-world pass |

---

## 9. FINAL DECISION

# **3. USE A DIFFERENT HOST**

**Recommended host:** **Pilot VPS (Ubuntu Server LTS, ≥4 vCPU / ≥8 GB RAM / ≥150 GB SSD)** with Docker Engine + Compose.

**This Windows laptop:** not certified for Phase 5.2B. It **requires configuration** (WSL2 + Docker Desktop + RAM discipline) even for smoke tests, and remains a poor fit for full stack certification.

---

## 10. Next Steps (after approval — ops)

1. Provision / access Pilot VPS per `PHASE24-PILOT-SERVER-REQUIREMENTS.md`.  
2. Install Docker Engine + Compose; pass hello-world host certification.  
3. Issue **HOST READY FOR PHASE 5.2B** on that host.  
4. Re-run **Phase 5.2B** there (app images + compose — still no customer deploy).  

---

## STOP

- No application containers run  
- No deployment  
- No infrastructure code modified  
- No Phase 5.2B started  
- Awaiting approval to provision/use Pilot VPS (or explicitly authorize Option A setup)  

*End of Phase 5.2C Docker Host Preparation.*
