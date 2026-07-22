# Database Backup & Restore Guide

**Scripts (Kodikz-owned):** `deploy/backup/pg-backup.sh` · `deploy/backup/pg-restore.sh`  
**Execution:** Dubai ops on Pilot VPS  

## Backup

```bash
export DATABASE_URL='postgresql://…'
export BACKUP_DIR=/var/backups/kodikz/postgres
./deploy/backup/pg-backup.sh
```

Produces `giscd-YYYYMMDDTHHMMSSZ.dump` + `.sha256`.

## Restore

```bash
export DATABASE_URL='postgresql://…'
./deploy/backup/pg-restore.sh /var/backups/kodikz/postgres/giscd-….dump
```

## Retention (recommendation for Dubai)

| Type | Retention |
|------|-----------|
| Daily logical dump | 14 days |
| Pre-migrate dump | Keep until next successful migrate + 7 days |
| Provider volume snapshot | Per Dubai policy |

## Object storage

MinIO/S3 bucket backup is **Dubai-owned** (versioning or `mc mirror`). Not automated in these scripts.
