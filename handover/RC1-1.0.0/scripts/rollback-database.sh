#!/usr/bin/env bash
# Destructive DB rollback — requires explicit confirmation. Prefer backup restore.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Database rollback (DESTRUCTIVE)"
load_version
load_env

echo "WARNING: Schema rollback is not automatically reversible for RC1."
echo "Preferred path: ./scripts/restore.sh from a pre-migrate backup."
echo "This command will NOT drop volumes automatically."

confirm "Type confirmation to attempt documented rollback procedure?" || die "Aborted"

echo "Recording current migration version before any change..."
"${SCRIPT_DIR}/migration-status.sh" || true
mkdir -p "${PKG_ROOT}/reports/rollback"
"${SCRIPT_DIR}/backup.sh" || die "Backup required before rollback"

cat <<'EOF'
RC1 ships a single forward migration (schema v1).
There is no automated down-migration script in this package.
Restore from backup to revert schema+data:
  ./scripts/restore.sh <backup-dir>
EOF

audit "rollback-database refused-auto — operator directed to restore.sh"
next_action "Use ./scripts/restore.sh <backup> for compatibility-safe rollback"
exit 1
