#!/usr/bin/env bash
# Shared helpers for Kodikz RC1 plug-and-play operator scripts.
# shellcheck disable=SC2034

set -euo pipefail

PKG_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PKG_ROOT

VERSION_FILE="${PKG_ROOT}/VERSION"
LOG_DIR="${PKG_ROOT}/logs"
REPORT_DIR="${PKG_ROOT}/reports"
CONFIG_DIR="${PKG_ROOT}/config"
ENV_FILE="${CONFIG_DIR}/.env.production"
COMPOSE_FILE="${PKG_ROOT}/deploy/docker-compose.plugplay.yml"
AUDIT_LOG="${LOG_DIR}/operator-audit.log"
SUPPORT_DIR="${PKG_ROOT}/support-bundles"

mkdir -p "${LOG_DIR}" "${REPORT_DIR}" "${CONFIG_DIR}" "${PKG_ROOT}/images" \
  "${PKG_ROOT}/data/postgres" "${PKG_ROOT}/data/minio" "${PKG_ROOT}/data/backups" \
  "${PKG_ROOT}/data/certs" "${SUPPORT_DIR}"

heading() {
  echo ""
  echo "============================================================"
  echo " $*"
  echo "============================================================"
}

release_banner() {
  load_version
  echo "=============================================================================="
  echo "KODIKZ SMART CITY MAPPING & SURVEY GUIDANCE PLATFORM"
  echo "Version : ${APP_VERSION}"
  echo "Release : ${RELEASE_CHANNEL:-RC1}"
  echo "Tag     : ${GIT_TAG}"
  echo "=============================================================================="
}

next_action() {
  echo ""
  echo "NEXT: $*"
}

result_line() {
  # result_line PASS|WARNING|FAIL "message"
  echo "RESULT: ${1} — ${2}"
}

audit() {
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "[${ts}] $*" >>"${AUDIT_LOG}"
}

die() {
  echo "ERROR: $*" >&2
  audit "FAIL $*"
  result_line FAIL "$*"
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

redact() {
  sed -E \
    -e 's/(PASSWORD|SECRET|TOKEN|KEY|JWT|AUTHORIZATION|COOKIE)[A-Za-z0-9_]*[[:space:]]*[=:][[:space:]]*.*/\1=[REDACTED]/Ig' \
    -e 's/(postgres(ql)?:\/\/)[^@[:space:]]+@/\1[REDACTED]@/Ig' \
    -e 's/(mongodb(\+srv)?:\/\/)[^@[:space:]]+@/\1[REDACTED]@/Ig' \
    -e 's/Bearer[[:space:]]+[A-Za-z0-9._~\-+/=]+/Bearer [REDACTED]/Ig' \
    -e 's/eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/[REDACTED_JWT]/g' \
    -e 's/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/[REDACTED_PRIVATE_KEY]/g'
}

load_version() {
  [[ -f "${VERSION_FILE}" ]] || die "VERSION file missing"
  # shellcheck disable=SC1090
  source "${VERSION_FILE}"
  : "${APP_VERSION:?APP_VERSION missing in VERSION}"
  : "${GIT_TAG:?GIT_TAG missing in VERSION}"
  : "${GIT_COMMIT:?GIT_COMMIT missing in VERSION}"
  RELEASE_CHANNEL="${RELEASE_CHANNEL:-RC1}"
  PRODUCT_NAME="${PRODUCT_NAME:-Kodikz Smart City Mapping & Survey Guidance Platform}"
}

load_env() {
  [[ -f "${ENV_FILE}" ]] || die "Missing ${ENV_FILE}. Run ./scripts/configure.sh first."
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
}

compose() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

confirm() {
  local prompt="${1:-Continue?}"
  local ans
  read -r -p "${prompt} [y/N] " ans
  [[ "${ans}" == "y" || "${ans}" == "Y" ]]
}

is_secret_name() {
  case "$1" in
    *PASSWORD*|*SECRET*|*TOKEN*|*KEY*|*JWT*|*COOKIE*) return 0 ;;
    *) return 1 ;;
  esac
}
