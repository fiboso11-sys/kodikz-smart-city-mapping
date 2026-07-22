#!/usr/bin/env bash
# Validate config/.env.production without printing secrets.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Validate configuration"
load_version
audit "validate-config start"

[[ -f "${ENV_FILE}" ]] || die "Missing ${ENV_FILE}"
perm="$(stat -c '%a' "${ENV_FILE}" 2>/dev/null || stat -f '%OLp' "${ENV_FILE}" 2>/dev/null || echo unknown)"
if [[ "${perm}" != "600" && "${perm}" != "0600" ]]; then
  echo "WARNING: ${ENV_FILE} permissions are ${perm} (expected 600)"
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

require_var() {
  local n="$1"
  if [[ -z "${!n:-}" ]]; then
    die "Required variable missing: ${n}"
  fi
}

for v in DEPLOYMENT_MODE APP_URL AUTH_JWT_SECRET DATABASE_URL POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB \
  S3_ENDPOINT S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY NEXT_PUBLIC_API_URL NEXT_PUBLIC_SOCKET_URL \
  APP_IMAGE WORKER_IMAGE IMAGE_SOURCE TLS_MODE; do
  require_var "${v}"
done

[[ "${APP_URL}" =~ ^https?:// ]] || die "APP_URL malformed"
[[ "${DATABASE_URL}" == postgresql://* ]] || die "DATABASE_URL must be postgresql://"
[[ ${#AUTH_JWT_SECRET} -ge 16 ]] || die "AUTH_JWT_SECRET too short"
case "${AUTH_JWT_SECRET}" in CHANGE_ME|REPLACE*|password|secret) die "AUTH_JWT_SECRET looks like a placeholder" ;; esac
case "${POSTGRES_PASSWORD}" in CHANGE_ME|REPLACE*|password|Password1) die "POSTGRES_PASSWORD looks like a placeholder" ;; esac
case "${IMAGE_SOURCE}" in offline|registry) ;; *) die "IMAGE_SOURCE invalid" ;; esac

echo "Configuration validation PASS (values not displayed)."
audit "validate-config pass"
next_action "Run ./scripts/deploy.sh"
exit 0
