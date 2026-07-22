#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Uninstall"
load_version
[[ -f "${ENV_FILE}" ]] && load_env || true

echo "This stops and removes containers/networks for this package."
echo "DATA VOLUMES under data/ are preserved by default."
confirm "Stop and remove Compose services (keep data/)?" || die "Aborted"

compose down --remove-orphans || true
# Explicitly do NOT: docker volume rm, rm -rf data/

audit "uninstall compose down (data preserved)"
echo "Services removed. Persistent data kept in data/"
echo "To destroy data permanently (IRREVERSIBLE), manually delete data/ after backup."
next_action "Archive package or re-run deploy.sh"
exit 0
