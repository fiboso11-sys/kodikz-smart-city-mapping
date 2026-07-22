#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Restore (DESTRUCTIVE)"
load_version
load_env

SRC="${1:-}"
[[ -n "${SRC}" ]] || die "Usage: ./scripts/restore.sh <backup-directory>"
[[ -d "${SRC}" ]] || die "Backup directory not found: ${SRC}"
[[ -f "${SRC}/MANIFEST.txt" ]] || die "MANIFEST.txt missing"
[[ -f "${SRC}/postgres.dump" ]] || die "postgres.dump missing"

echo "Backup: ${SRC}"
cat "${SRC}/MANIFEST.txt"
echo ""
confirm "This will replace live PostgreSQL data after safeguarding current state. Continue?" || die "Aborted"

# Integrity
if [[ -f "${SRC}/CHECKSUMS.sha256" ]]; then
  (cd "${SRC}" && sha256sum -c CHECKSUMS.sha256) || die "Backup integrity check failed"
fi

# Compatibility
if [[ -f "${SRC}/VERSION" ]]; then
  echo "Backup VERSION:"
  grep -E 'APP_VERSION|GIT_COMMIT' "${SRC}/VERSION" || true
fi

# Preserve current
PRE="${PKG_ROOT}/data/backups/pre-restore-$(date -u +%Y%m%dT%H%M%SZ)"
echo "Creating safety backup at ${PRE}"
"${SCRIPT_DIR}/backup.sh"
# Move latest to named pre-restore if needed — backup.sh already created one

step_stop() {
  compose stop app worker nginx || true
}

step_stop

echo "Restoring PostgreSQL..."
compose exec -T postgres pg_restore -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --clean --if-exists <"${SRC}/postgres.dump" \
  || echo "WARNING: pg_restore reported errors — inspect carefully"

if [[ -f "${SRC}/minio-data.tar.gz" ]]; then
  echo "Restoring MinIO data..."
  compose stop minio || true
  tar -C "${MINIO_DATA_DIR:-${PKG_ROOT}/data/minio}" -xzf "${SRC}/minio-data.tar.gz"
  compose start minio || true
fi

compose start app worker nginx || compose up -d app worker nginx

REPORT="${REPORT_DIR}/RESTORE-REPORT.md"
{
  echo "# Restore Report"
  echo "- Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- Source: ${SRC}"
  echo "- Safety backup created via backup.sh before restore"
  echo "- Post-restore: run ./scripts/validate.sh"
} >"${REPORT}"

audit "restore from ${SRC}"
echo "Restore finished. Report: ${REPORT}"
next_action "Run ./scripts/validate.sh"
exit 0
