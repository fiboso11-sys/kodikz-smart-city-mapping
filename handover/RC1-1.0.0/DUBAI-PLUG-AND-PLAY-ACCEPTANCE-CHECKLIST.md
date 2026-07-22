# Dubai Plug-and-Play Acceptance Checklist

**Release:** RC1 1.0.0 (`v1.0.0-rc1`)  
**Owners:** Dubai Infrastructure Team · Kodikz · Joint

Legend: **D** = Dubai · **K** = Kodikz · **J** = Joint

---

## Stage A — Server Ready
| # | Item | Owner | Done |
|---|------|-------|------|
| A1 | Ubuntu 22.04/24.04 LTS provisioned | D | ☐ |
| A2 | 4+ vCPU, 8+ GB RAM, 150+ GB disk | D | ☐ |
| A3 | Docker Engine + Compose plugin | D | ☐ |
| A4 | Firewall: 22/80/443 in; 5432/9000/3000 not public | D | ☐ |
| A5 | DNS A/AAAA for pilot hostname | D | ☐ |
| A6 | TLS certs available (or external terminator) | D | ☐ |
| A7 | NTP / timezone documented | D | ☐ |

## Stage B — Package Verified
| # | Item | Owner | Done |
|---|------|-------|------|
| B1 | Package transferred intact | D | ☐ |
| B2 | `VERSION` matches expected RC1 | J | ☐ |
| B3 | `CHECKSUMS.sha256` verifies | D | ☐ |
| B4 | Offline images present **or** registry reachable | J | ☐ |
| B5 | `./scripts/preflight.sh` PASS (no FAIL) | D | ☐ |

## Stage C — Configuration Complete
| # | Item | Owner | Done |
|---|------|-------|------|
| C1 | `./scripts/configure.sh` completed | D | ☐ |
| C2 | `./scripts/validate-config.sh` PASS | D | ☐ |
| C3 | Secrets stored in Dubai secret store (not chat/email) | D | ☐ |
| C4 | GPS URLs confirmed | J | ☐ |

## Stage D — Deployment Complete
| # | Item | Owner | Done |
|---|------|-------|------|
| D1 | `./scripts/deploy.sh` finished without abort | D | ☐ |
| D2 | `reports/DEPLOYMENT-REPORT.md` generated | D | ☐ |
| D3 | Digests recorded under `images/` | D | ☐ |
| D4 | No unexpected data wipe | J | ☐ |

## Stage E — Runtime Validation Complete
| # | Item | Owner | Done |
|---|------|-------|------|
| E1 | `./scripts/validate.sh` → VALIDATED or WITH WARNINGS | D | ☐ |
| E2 | Health + readiness OK | D | ☐ |
| E3 | System Health page shows release identity | J | ☐ |
| E4 | About / Version page accessible from Settings | J | ☐ |
| E5 | HTTPS OK (if configured) | D | ☐ |
| E6 | Socket.IO/GPS probe acceptable | J | ☐ |
| E7 | Backup command exercised once | D | ☐ |
| E8 | `./scripts/support.sh` produces sanitized bundle | D | ☐ |

## Stage F — Joint Application Acceptance
| # | Item | Owner | Done |
|---|------|-------|------|
| F1 | Login / RBAC smoke | J | ☐ |
| F2 | Supervisor assign + driver copilot smoke | J | ☐ |
| F3 | Photo upload to object storage | J | ☐ |
| F4 | Known limitations acknowledged | J | ☐ |

## Stage G — Pilot Approved
| # | Item | Owner | Done |
|---|------|-------|------|
| G1 | Dubai signs Stage A–E infrastructure acceptance | D | ☐ |
| G2 | Kodikz signs application acceptance | K | ☐ |
| G3 | Pilot start date agreed | J | ☐ |
| G4 | Support contacts active (`PILOT-SUPPORT-PLAN.md`) | J | ☐ |

---

**Sign-off**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Dubai Infrastructure | | | |
| Kodikz | | | |
| Joint Pilot Lead | | | |
