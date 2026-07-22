# Log Collection Policy

## Defaults (`support.sh`)

| Control | Default | Override |
|---------|---------|----------|
| Time window | Last **30 minutes** | `SUPPORT_LOG_SINCE` (Docker `--since`) |
| Line limit | **2000** lines / service | `SUPPORT_LOG_LINES` |

## Services collected

- `app` (full-stack Next.js)
- `worker`
- `postgres` (readiness/log only — no dumps)
- `nginx` (when present)
- `minio` (when present)

MongoDB is **not** in this Compose stack — marked NOT AVAILABLE.

## Rules

- Always sanitize before archive
- Never collect unlimited logs
- Never collect binary customer uploads
- Failures of optional log collection → `NOT AVAILABLE` (bundle still succeeds)
