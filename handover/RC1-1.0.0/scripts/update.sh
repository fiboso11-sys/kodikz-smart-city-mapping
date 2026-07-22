#!/usr/bin/env bash
# Update to a new package directory / image set.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Update"
load_version
load_env

NEW_PKG="${1:-}"
[[ -n "${NEW_PKG}" ]] || die "Usage: ./scripts/update.sh <path-to-new-release-package>"

[[ -d "${NEW_PKG}" ]] || die "New package not found"
[[ -f "${NEW_PKG}/VERSION" ]] || die "New package missing VERSION"
[[ -f "${NEW_PKG}/CHECKSUMS.sha256" ]] || die "New package missing CHECKSUMS.sha256"

echo "Current: ${APP_VERSION}"
echo "New package: ${NEW_PKG}"
(cd "${NEW_PKG}" && sha256sum -c CHECKSUMS.sha256) || die "New package checksum failed"

mkdir -p "${PKG_ROOT}/reports/rollback"
cp -a "${PKG_ROOT}/VERSION" "${PKG_ROOT}/reports/rollback/VERSION.before-update.$(date -u +%Y%m%d%H%M%S)"
echo "${APP_VERSION}" >"${PKG_ROOT}/reports/rollback/known-good-version.txt"

confirm "Backup and update from ${NEW_PKG}?" || die "Aborted"
"${SCRIPT_DIR}/backup.sh"

# Preserve current known-good images dir
mkdir -p "${PKG_ROOT}/images/known-good"
cp -a "${PKG_ROOT}/images/"*.tar "${PKG_ROOT}/images/known-good/" 2>/dev/null || true

# Load new images if present
NEW_VER="$(grep APP_VERSION= "${NEW_PKG}/VERSION" | cut -d= -f2)"
NEW_TAR="${NEW_PKG}/images/kodikz-rc1-${NEW_VER}-images.tar"
if [[ -f "${NEW_TAR}" ]]; then
  docker load -i "${NEW_TAR}"
elif [[ "${IMAGE_SOURCE}" == "registry" ]]; then
  # shellcheck disable=SC1090
  source "${NEW_PKG}/VERSION"
  docker pull "${APP_IMAGE}"
  docker pull "${WORKER_IMAGE}"
else
  die "No images available for update"
fi

# Copy new compose/scripts carefully — operator typically replaces whole package
echo "Apply migrations from new package scripts if present..."
if [[ -x "${NEW_PKG}/scripts/migrate.sh" ]]; then
  # Use current compose with new migrate if env compatible
  bash "${NEW_PKG}/scripts/migrate.sh" || die "Migration failed — restore from backup"
fi

compose up -d
bash "${SCRIPT_DIR}/validate.sh" || die "Post-update validation failed"

echo "${NEW_VER}" >"${PKG_ROOT}/reports/successful-release.txt"
audit "update to ${NEW_VER}"
echo "Update marked successful. Previous known-good retained under images/known-good and reports/rollback/"
next_action "Monitor with ./scripts/status.sh"
exit 0
