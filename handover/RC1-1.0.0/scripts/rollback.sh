#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Rollback"
load_version
load_env

KG="${PKG_ROOT}/reports/rollback/known-good-version.txt"
[[ -f "${KG}" ]] || die "No known-good version recorded. Cannot auto-rollback."

PREV="$(cat "${KG}")"
echo "Previous known-good: ${PREV}"
confirm "Stop current services and roll back to ${PREV}?" || die "Aborted"

"${SCRIPT_DIR}/backup.sh" || true

compose stop app worker nginx || true

# Prefer known-good image tar
KG_TAR="$(ls -1 "${PKG_ROOT}/images/known-good/"*images.tar 2>/dev/null | head -1 || true)"
if [[ -n "${KG_TAR}" ]]; then
  docker load -i "${KG_TAR}"
else
  echo "WARNING: No known-good image tar — attempting tagged images for ${PREV}"
  docker image inspect "kodikz-smart-city-app:${PREV}" >/dev/null 2>&1 || die "Previous images not available locally"
fi

# DB compatibility: restore last pre-update backup if schema incompatible
LATEST_BACKUP="$(ls -1dt "${PKG_ROOT}/data/backups"/backup-* 2>/dev/null | head -1 || true)"
echo "If schema is incompatible, restore: ./scripts/restore.sh ${LATEST_BACKUP}"
confirm "Restore database from latest backup ${LATEST_BACKUP}?" && {
  [[ -n "${LATEST_BACKUP}" ]] || die "No backup"
  bash "${SCRIPT_DIR}/restore.sh" "${LATEST_BACKUP}"
}

compose up -d
bash "${SCRIPT_DIR}/validate.sh" || echo "WARNING: validation reported issues"

REPORT="${REPORT_DIR}/ROLLBACK-REPORT.md"
{
  echo "# Rollback Report"
  echo "- Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- Target known-good: ${PREV}"
  echo "- Known-good package was NOT deleted"
} >"${REPORT}"

audit "rollback to ${PREV}"
next_action "Review ${REPORT} and notify Kodikz if validation failed"
exit 0
