# Database Rollback Runbook

**Policy:** Schema v1 has **no automated down migration**. Rollback = restore from logical backup taken **before** change.

## Steps

1. Stop app + worker (`docker compose stop app worker`) to prevent writes  
2. Restore dump: `./deploy/backup/pg-restore.sh /var/backups/kodikz/postgres/giscd-TIMESTAMP.dump`  
3. Verify counts (script prints `survey_assignments` / `audit_events`)  
4. Start app + worker  
5. Hit `/api/readiness`  
6. Spot-check login + one assignment  

## Failure

If restore fails mid-way, restore again from known-good dump; do not partially apply app code that expects newer schema (v1 only today).
