# Dubai Server Runtime Validation Checklist

**Executor:** Dubai infrastructure team  
**Kodikz role:** Support / interpret failures  
**Rule:** Items below are **REQUIRES DUBAI SERVER VALIDATION** until checked on Dubai host.

## Static template review (Kodikz — this phase)

| Asset | Classification |
|-------|----------------|
| `Dockerfile` (Corepack pnpm@10.33.4 in runner) | **STATICALLY VERIFIED** |
| `docker-compose.pilot.yml` | **STATICALLY VERIFIED** |
| `docker-compose.production-template.yml` | **STATICALLY VERIFIED** |
| `docker-compose.municipality-template.yml` | **STATICALLY VERIFIED** |
| `deploy/nginx/pilot.conf` | **STATICALLY VERIFIED** |
| Service names app/worker/postgres/minio/nginx | **STATICALLY VERIFIED** |
| Volumes pgdata_pilot / minio_pilot | **STATICALLY VERIFIED** |
| Healthchecks (postgres, app readiness) | **STATICALLY VERIFIED** |
| Restart `unless-stopped` | **STATICALLY VERIFIED** |
| depends_on postgres healthy | **STATICALLY VERIFIED** |
| MinIO healthcheck absent | **STATICALLY VERIFIED** (gap — validate race on server) |
| TLS certs present on server | **REQUIRES DUBAI SERVER VALIDATION** |
| Image build / `pnpm --version` in container | **REQUIRES DUBAI SERVER VALIDATION** |
| Compose up healthy | **REQUIRES DUBAI SERVER VALIDATION** |

## Dubai runtime checklist

- [ ] `docker version` / `docker compose version`
- [ ] `docker build --target runner` and `worker` succeed
- [ ] `docker run … pnpm --version` → 10.33.4
- [ ] Copy `.env.pilot` (mode 600); no secrets in git
- [ ] Place TLS certs in `deploy/certs/`
- [ ] `docker compose -f docker-compose.pilot.yml up -d --build`
- [ ] `docker compose ps` all healthy/running
- [ ] `curl -k https://<host>/readiness` → ready
- [ ] `curl -k https://<host>/health` → ok
- [ ] Logs: no crash loop (`docker compose logs -f app worker`)
- [ ] Postgres not published publicly
- [ ] MinIO not published publicly
