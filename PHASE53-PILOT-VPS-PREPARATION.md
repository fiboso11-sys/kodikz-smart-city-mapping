# Phase 5.3 — Pilot VPS Preparation

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Date:** 2026-07-22  
**Prior:** Phase 5.2C → **USE A DIFFERENT HOST** (Pilot VPS)  
**Scope:** Prepare Pilot VPS OS/environment only · No app deploy · No Compose · No image builds · No git  

---

## 1. Executive Summary

Phase 5.3 could **not** prepare or certify a Pilot VPS because **no Pilot VPS target was available to this session**.

| Finding | Evidence |
|---------|----------|
| No Pilot VPS hostname / IP in repo or phase brief | `PHASE24-PILOT-SERVER-REQUIREMENTS.md` has specs only; `.env.pilot.example` uses placeholder `survey-pilot.example.ae` |
| No SSH connection parameters supplied in this chat | No host, user, key, or jump-box provided |
| Local Windows workstation is not the Pilot VPS | Established in 5.2B/5.2C |
| Existing `api-kodikz.giantphoenixllc.com` | GPS backend VPS — **out of scope** for survey pilot host prep (architecture: GPS remains separate) |

**No OS hardening, Docker install, hello-world, storage layout, or firewall changes were executed** — doing so would require inventing a host or modifying the wrong machine.

| Field | Value |
|-------|--------|
| **FINAL DECISION** | **3. HOST NOT READY** |
| **Infrastructure Readiness Score (host prep)** | **0 / 100** (host not provisioned / not accessible) |
| **Phase 5.2B on VPS** | **Blocked** until a reachable Ubuntu Pilot VPS is provided and Steps 1–8 complete |

---

## 2. Host Inventory

| Attribute | Status |
|-----------|--------|
| Official certification host (intended) | Pilot VPS (Ubuntu) |
| Provisioned & reachable this session | **No** |
| OS / vCPU / RAM / disk measured | **Not measured** (no SSH) |
| Static public IP | **Unknown** |
| SSH access proven | **No** |
| Sudo proven | **No** |

**Deficiencies:** Entire Step 1 checklist unmet due to missing host access — not due to a failed remote command.

---

## 3. Operating System Audit (Step 2)

| Item | Result |
|------|--------|
| OS updates / firewall / SSH hardening / fail2ban / chrony / hostname / disk / swap / logrotate | **NOT EXECUTED** |

No fabricated `ufw` / `sshd_config` outputs.

---

## 4. Docker Installation Report (Step 3)

| Item | Result |
|------|--------|
| Docker Engine install | **NOT EXECUTED** |
| Compose plugin install | **NOT EXECUTED** |
| `docker version` / `compose version` / `docker info` | **NOT EXECUTED** |
| `hello-world` | **NOT EXECUTED** (STOP: no app containers; hello-world also requires a VPS) |

---

## 5. Storage Audit (Step 4)

Intended layout (for when VPS exists) — **not created**:

```text
/opt/kodikz/                  # application compose project (later)
/var/lib/kodikz/postgres/     # reserved (bind or document volume path)
/var/lib/kodikz/minio/        # reserved
/var/lib/kodikz/mongodb/      # optional note: Mongo stays on GPS stack
/var/backups/kodikz/          # backup foundation
/var/log/kodikz/              # app/nginx logs (later)
/etc/kodikz/certs/            # TLS material (later)
/etc/kodikz/env/              # .env.pilot (mode 600, later)
```

| Item | Result |
|------|--------|
| Directories created | **NOT EXECUTED** |
| Permissions verified | **NOT EXECUTED** |

---

## 6. Network Audit (Step 5)

| Item | Result |
|------|--------|
| Firewall rules (22/80/443; DB not public) | **NOT EXECUTED** |
| DNS for pilot hostname | Placeholder only in `.env.pilot.example` |
| Reverse proxy readiness | Nginx config exists **in repo**; not installed on VPS |
| Socket.IO | Remains on external GPS host by design |

---

## 7. Security Audit (Step 6)

| Item | Result |
|------|--------|
| SSH keys / disable password / disable root login | **NOT EXECUTED** |
| Docker group membership | **NOT EXECUTED** |
| Secrets directory mode 600/700 | **NOT EXECUTED** |

---

## 8. Backup Preparation (Step 7)

| Item | Result |
|------|--------|
| Backup/restore directories on VPS | **NOT EXECUTED** |
| Retention policy documented (draft) | Keep **7–14 daily** logical dumps under `/var/backups/kodikz/postgres/` once host exists; no app backups yet |
| Snapshot strategy | Prefer provider volume snapshots **plus** `pg_dump` (scripts already in repo) — apply on VPS later |

---

## 9. Host Performance (Step 8)

| Metric | Result |
|--------|--------|
| CPU / RAM / disk / load / Docker daemon | **NOT MEASURED** |

---

## 10. Quality Gate

| Gate | Status |
|------|--------|
| Ubuntu supported | **FAIL** (host unknown) |
| Docker / Compose / hello-world | **FAIL** |
| Networking / storage / firewall / SSH secured | **FAIL** |
| Sufficient CPU / RAM / storage | **FAIL** (unverified) |

---

## 11. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Certifying without a real VPS | Critical | Provision VPS; re-run 5.3 |
| Using GPS VPS as survey host | High | Keep GPS separate per architecture |
| Using Windows laptop instead | High | Rejected in 5.2C |
| Delay to Dubai pilot timeline | Medium | Dubai/ops provision VPS ASAP |

---

## 12. What Ops Must Provide Before Re-running Phase 5.3

1. **SSH target:** `user@host` (or IP) + key-based access with sudo  
2. **Confirm sizing:** ≥4 vCPU, ≥8 GB RAM, ≥150 GB SSD, Ubuntu 22.04/24.04 LTS  
3. **Confirm network:** static IP or DNS name for pilot TLS  
4. **Approve** remote execution of hardening + Docker Engine install + hello-world  

Then re-issue Phase 5.3 with live command evidence.

### Preparation runbook (execute only on approved VPS — not run this session)

```bash
# Identity
hostnamectl; cat /etc/os-release; nproc; free -h; df -h

# Updates + baseline
sudo apt-get update && sudo apt-get -y upgrade
sudo timedatectl set-timezone Asia/Dubai   # or UTC per policy
sudo apt-get install -y ufw fail2ban chrony curl ca-certificates

# Firewall (SSH + HTTP/S only; never publish 5432/9000 publicly)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Docker Engine + Compose plugin (per docs.docker.com/engine/install/ubuntu/)
# ... install ...
docker version
docker compose version
docker run --rm hello-world

# Storage foundation
sudo mkdir -p /opt/kodikz /var/backups/kodikz/{postgres,minio,config} \
  /var/log/kodikz /etc/kodikz/{certs,env}
sudo chmod 750 /etc/kodikz /var/backups/kodikz
sudo chmod 700 /etc/kodikz/env
```

---

## 13. Infrastructure Readiness Score

| Dimension | Score |
|-----------|-------|
| Host accessibility | 0 |
| OS hardening executed | 0 |
| Docker platform | 0 |
| Storage / network / security / backup foundation | 0 |
| **Overall host prep** | **0 / 100** |

*(Application infra score from Phase 5.2 source work remains separate; this score is **host preparation only**.)*

---

## 14. FINAL DECISION

# **3. HOST NOT READY**

**Why:** No Pilot VPS was reachable or identified. Steps 1–8 were not executed. Fabricating Docker/hello-world success would violate evidence rules.

**Do not start Phase 5.2B** until a prepared VPS achieves decision **1** or **2** in a re-run of this phase.

---

## STOP

- No containers started  
- No application deployed  
- No Compose  
- No image builds  
- No database restore  
- No source changes  
- Awaiting **Pilot VPS SSH details + approval** to execute real preparation  

*End of Phase 5.3 Pilot VPS Preparation report.*
