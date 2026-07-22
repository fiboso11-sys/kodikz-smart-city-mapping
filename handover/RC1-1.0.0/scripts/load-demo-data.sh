#!/usr/bin/env bash
# OPTIONAL — never run automatically in production.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Load DEMO data (NOT FOR PRODUCTION)"
cat <<'EOF'
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  DEMO DATA IS NOT FOR PRODUCTION OR DUBAI PILOT GO-LIVE.
  This command is optional and disabled unless you confirm.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
EOF

confirm "I understand this is demo-only and should not run in production. Continue?" || die "Aborted"

if [[ ! -f "${PKG_ROOT}/database/demo/README.md" ]]; then
  die "No demo loader packaged for RC1 (by design). Demo seed is not shipped for production handover."
fi

echo "Demo loader present — follow database/demo/README.md"
audit "load-demo-data blocked-or-manual"
next_action "Do not use demo data on Dubai pilot without written approval"
exit 1
