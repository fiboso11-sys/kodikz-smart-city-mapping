#!/usr/bin/env bash
# Verify package identity and checksums (no secrets printed).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Verify release identity"
load_version

echo "APP_VERSION=${APP_VERSION}"
echo "GIT_TAG=${GIT_TAG}"
echo "GIT_COMMIT=${GIT_COMMIT}"

[[ -f "${PKG_ROOT}/RELEASE-MANIFEST.json" ]] || die "RELEASE-MANIFEST.json missing"
[[ -f "${PKG_ROOT}/CHECKSUMS.sha256" ]] || die "CHECKSUMS.sha256 missing"

(cd "${PKG_ROOT}" && sha256sum -c CHECKSUMS.sha256) || die "Modified or missing release files detected"

audit "verify-release pass"
echo "Release identity and checksums OK."
next_action "Run ./scripts/preflight.sh on the Dubai host"
exit 0
