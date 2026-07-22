# Dubai Infrastructure Requirements

**Audience:** Dubai infrastructure team  
**Author:** Kodikz (requirements only — **Kodikz does not configure the server**)

## Compute / storage

| Spec | Minimum | Preferred |
|------|---------|-----------|
| OS | Ubuntu **22.04 or 24.04** LTS | 24.04 LTS |
| vCPU | 4 | 8 |
| RAM | 8 GB | 16 GB |
| Disk | 150 GB SSD | 250 GB+ |
| Swap | Recommended ≥2 GB | — |

## Docker

| Component | Requirement |
|-----------|-------------|
| Docker Engine | 24+ (current stable) |
| Docker Compose | Plugin v2 (`docker compose`) |
| Runtime | Linux containers |

## Network

| Direction | Ports / access |
|-----------|----------------|
| Inbound | **22** (SSH admin) · **80** · **443** |
| Inbound forbidden | **5432**, **9000**, **9001**, app **3000** publicly |
| Outbound | GPS API/Socket HTTPS · OSM/Carto tiles · MapLibre glyphs · (optional) Nominatim |
| DNS | A/AAAA for pilot hostname → VPS |
| TLS | Valid cert for APP_URL (fullchain + privkey for Nginx template) |

## Persistence

| Volume | Purpose |
|--------|---------|
| Postgres data | Assignments, audit, sessions |
| MinIO data | Photos / attachments |
| Backup disk | Logical dumps + optional snapshots |

## Ops expectations

| Topic | Expectation |
|-------|-------------|
| Timezone | `Asia/Dubai` or UTC (document choice) |
| NTP | chrony/systemd-timesyncd |
| Log retention | ≥14 days app/nginx; ship to Dubai SIEM if required |
| Backups | Daily `pg_dump` + pre-migrate dumps; MinIO backup per Dubai |
| SMTP | Not required by core survey app |
| Monitoring | Dubai-owned host monitoring; app exposes `/api/health` + `/api/readiness` |

## Out of Dubai Compose scope

GPS backend + MongoDB remain on existing GPS infrastructure unless Dubai relocates them.
