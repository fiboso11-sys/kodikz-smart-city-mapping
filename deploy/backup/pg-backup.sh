#!/usr/bin/env bash
# PostgreSQL logical backup for pilot
# Usage: ./deploy/backup/pg-backup.sh
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL required}"
: "${BACKUP_DIR:=./backups/postgres}"
mkdir -p "$BACKUP_DIR"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT="$BACKUP_DIR/giscd-$STAMP.dump"
echo "Backing up to $OUT"
pg_dump --format=custom --file="$OUT" "$DATABASE_URL"
sha256sum "$OUT" > "$OUT.sha256"
echo "OK $OUT"
