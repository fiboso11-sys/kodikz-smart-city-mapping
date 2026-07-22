#!/usr/bin/env bash
# Create a backup bundle. Safe to run on Dubai host only (needs runtime).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Backup"
load_version
load_env
require_cmd docker

TS="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="${PKG_ROOT}/data/backups/backup-${APP_VERSION}-${TS}"
mkdir -p "${DEST}"

echo "Destination: ${DEST}"
audit "backup start ${DEST}"

# Postgres
compose exec -T postgres pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Fc >"${DEST}/postgres.dump" \
  || die "pg_dump failed"

# Mongo — not owned
echo "MongoDB: NOT INCLUDED (external GPS ownership)" >"${DEST}/mongodb.SKIPPED.txt"

# MinIO data snapshot (best-effort tar of volume mount)
if [[ -d "${MINIO_DATA_DIR:-${PKG_ROOT}/data/minio}" ]]; then
  tar -C "${MINIO_DATA_DIR:-${PKG_ROOT}/data/minio}" -czf "${DEST}/minio-data.tar.gz" . 2>/dev/null \
    || echo "WARNING: MinIO tar incomplete"
fi

# Config snapshot without secrets in logs — copy env with redacted content for operators? Keep real env in backup with 600
umask 077
cp -a "${ENV_FILE}" "${DEST}/env.production.secret" 2>/dev/null || true
chmod 600 "${DEST}/env.production.secret" 2>/dev/null || true
# Redacted copy for auditors
redact <"${ENV_FILE}" >"${DEST}/env.production.redacted.txt" || true

cp -a "${PKG_ROOT}/VERSION" "${DEST}/VERSION"
if [[ -f "${PKG_ROOT}/reports/migration-version.txt" ]]; then
  cp -a "${PKG_ROOT}/reports/migration-version.txt" "${DEST}/migration-version.txt"
fi

# Manifest + checksums
{
  echo "timestamp=${TS}"
  echo "app_version=${APP_VERSION}"
  echo "git_commit=${GIT_COMMIT}"
  echo "postgres_dump=postgres.dump"
  echo "minio=minio-data.tar.gz"
  echo "mongodb=SKIPPED_EXTERNAL"
} >"${DEST}/MANIFEST.txt"

(cd "${DEST}" && sha256sum postgres.dump MANIFEST.txt VERSION 2>/dev/null >CHECKSUMS.sha256) || true

# Retention
RET="${BACKUP_RETENTION_DAYS:-14}"
find "${PKG_ROOT}/data/backups" -maxdepth 1 -type d -name 'backup-*' -mtime "+${RET}" -exec rm -rf {} + 2>/dev/null || true

audit "backup complete ${DEST}"
echo "Backup complete: ${DEST}"
echo "Secrets were not printed to the console."
next_action "Store backup off-host per Dubai policy"
exit 0
