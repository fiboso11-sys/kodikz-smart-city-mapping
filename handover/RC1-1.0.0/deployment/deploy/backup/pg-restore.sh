#!/usr/bin/env bash
# Restore PostgreSQL from custom dump — validate counts after restore
# Usage: ./deploy/backup/pg-restore.sh backups/postgres/giscd-XXXX.dump
set -euo pipefail
DUMP="${1:?dump file required}"
: "${DATABASE_URL:?DATABASE_URL required}"
echo "WARNING: This restores into DATABASE_URL. Ensure target is correct."
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$DUMP"
psql "$DATABASE_URL" -c "SELECT 'survey_assignments' AS t, COUNT(*) FROM survey_assignments UNION ALL SELECT 'audit_events', COUNT(*) FROM audit_events;"
echo "Restore complete. Run application readiness check next."
