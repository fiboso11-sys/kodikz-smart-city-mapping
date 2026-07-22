#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Migration status"
load_version
load_env

compose exec -T postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" || die "PostgreSQL not ready"

echo "Target schema version (package): ${POSTGRES_SCHEMA_VERSION:-1}"
echo "Applied:"
compose exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c \
  "SELECT version, applied_at FROM schema_migrations ORDER BY version;" 2>/dev/null \
  || compose exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c \
  "SELECT version FROM schema_migrations ORDER BY version;"

if [[ -f "${PKG_ROOT}/reports/migration-version.txt" ]]; then
  echo "Last migrate marker:"
  cat "${PKG_ROOT}/reports/migration-version.txt"
fi

audit "migration-status"
next_action "If pending migrations remain, run ./scripts/migrate.sh"
exit 0
