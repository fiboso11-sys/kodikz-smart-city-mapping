#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Restart services (preserve volumes)"
load_version
load_env

TARGET="${1:-}"
if [[ -n "${TARGET}" ]]; then
  compose restart "${TARGET}"
else
  compose restart
fi

audit "restart target=${TARGET:-all}"
echo "Volumes were not deleted."
next_action "Run ./scripts/status.sh then ./scripts/validate.sh"
exit 0
