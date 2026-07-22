# Pilot Server Requirements

## Minimum (≤100 vehicles)
- 4 vCPU / 8 GB RAM / 150 GB SSD
- Ubuntu Server LTS
- Static IP or DNS + TLS
- Daily backup destination

## Preferred
- 8 vCPU / 16 GB RAM / 250 GB+ SSD
- Firewall + private Docker network
- Separate backup storage

## One-server pilot stack
Nginx + App + Worker + PostgreSQL + MinIO (+ optional Redis)

GPS backend remains on existing VPS.
