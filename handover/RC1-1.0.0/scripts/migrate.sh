#!/usr/bin/env bash
# Apply PostgreSQL migrations (reference/RBAC seed only — no demo data).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Database migrate"
load_version
load_env
require_cmd docker
audit "migrate start"

echo "Waiting for PostgreSQL..."
for i in $(seq 1 60); do
  if compose exec -T postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
compose exec -T postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" || die "PostgreSQL not ready"

echo "Pending: schema version target ${POSTGRES_SCHEMA_VERSION:-1} (reference roles/permissions/tenant only)"
echo "Demo data will NOT be loaded."

# Use packaged migrate:pg (reference/RBAC seed only — no demo data)
if compose exec -T app true >/dev/null 2>&1; then
  compose exec -T app pnpm migrate:pg
else
  compose run --rm --no-deps app pnpm migrate:pg
fi

echo "Recording migration version marker"
echo "${POSTGRES_SCHEMA_VERSION:-1}" >"${PKG_ROOT}/reports/migration-version.txt"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >>"${PKG_ROOT}/reports/migration-version.txt"

# Post-migration validation
compose exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c \
  "SELECT version FROM schema_migrations ORDER BY version;" || die "Post-migration validation failed"

audit "migrate complete"
next_action "Run ./scripts/migration-status.sh or continue deploy"
exit 0
