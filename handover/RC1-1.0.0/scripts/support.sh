#!/usr/bin/env bash
# Generate a sanitized support bundle for Kodikz support.
# Defaults: last 30 minutes of logs, max 2000 lines per service.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/sanitize-diagnostics.sh"

LOG_LINES="${SUPPORT_LOG_LINES:-2000}"
LOG_SINCE="${SUPPORT_LOG_SINCE:-30m}"

release_banner
heading "ACTION: Create support diagnostic bundle"
audit "support start"

load_version
mkdir -p "${SUPPORT_DIR}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/kodikz-support.XXXXXX")"
BUNDLE_NAME="kodikz-support-bundle-${STAMP}"
OUT_DIR="${TMP}/${BUNDLE_NAME}"
mkdir -p "${OUT_DIR}"
chmod 700 "${TMP}" "${OUT_DIR}"

na() { echo "NOT AVAILABLE: $*" >"$1"; }

# 3–5 Identity
{
  echo "product=${PRODUCT_NAME}"
  echo "version=${APP_VERSION}"
  echo "release=${RELEASE_CHANNEL}"
  echo "gitTag=${GIT_TAG}"
  echo "commitSha=${GIT_COMMIT}"
  echo "buildTimestamp=${BUILD_TIMESTAMP:-NOT AVAILABLE}"
  echo "migrationVersion=${POSTGRES_SCHEMA_VERSION:-1}"
  echo "appImage=${APP_IMAGE}"
  echo "workerImage=${WORKER_IMAGE}"
  echo "appDigest=${APP_IMAGE_DIGEST:-NOT AVAILABLE}"
  echo "collectedAt=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
} >"${OUT_DIR}/version.txt"

if [[ -f "${PKG_ROOT}/RELEASE-MANIFEST.json" ]]; then
  cp "${PKG_ROOT}/RELEASE-MANIFEST.json" "${OUT_DIR}/release-manifest.json"
else
  na "${OUT_DIR}/release-manifest.json"
fi

# Env summary — names only, never values for secrets
{
  echo "# Environment variable presence (values not included)"
  if [[ -f "${ENV_FILE}" ]]; then
    while IFS= read -r line || [[ -n "${line}" ]]; do
      [[ "${line}" =~ ^[[:space:]]*# ]] && continue
      [[ -z "${line}" ]] && continue
      key="${line%%=*}"
      key="${key// /}"
      [[ -z "${key}" ]] && continue
      if is_secret_name "${key}"; then
        echo "${key}=SET (secret)"
      else
        echo "${key}=SET (non-secret)"
      fi
    done <"${ENV_FILE}"
  else
    echo "ENV_FILE=MISSING"
  fi
} >"${OUT_DIR}/environment-summary.txt"

# 6–8 Docker
if command -v docker >/dev/null 2>&1; then
  docker --version >"${OUT_DIR}/docker-version.txt" 2>&1 || na "${OUT_DIR}/docker-version.txt"
  docker compose version >"${OUT_DIR}/compose-version.txt" 2>&1 || na "${OUT_DIR}/compose-version.txt"
  if [[ -f "${ENV_FILE}" ]]; then
    compose ps >"${OUT_DIR}/container-status.txt" 2>&1 || na "${OUT_DIR}/container-status.txt"
    compose ps --format json >"${OUT_DIR}/container-status.json" 2>&1 || true
  else
    na "${OUT_DIR}/container-status.txt"
  fi
else
  na "${OUT_DIR}/docker-version.txt"
  na "${OUT_DIR}/compose-version.txt"
  na "${OUT_DIR}/container-status.txt"
fi

# 10 Logs (bounded)
collect_logs() {
  local svc="$1"
  local dest="${OUT_DIR}/logs-${svc}.txt"
  if [[ -f "${ENV_FILE}" ]] && command -v docker >/dev/null 2>&1; then
    compose logs --since "${LOG_SINCE}" --tail "${LOG_LINES}" "${svc}" 2>&1 | sanitize_stream >"${dest}" \
      || na "${dest}"
  else
    na "${dest}"
  fi
}
collect_logs app
collect_logs worker
collect_logs postgres
collect_logs nginx
collect_logs minio

# 11–14 Host resources
df -h >"${OUT_DIR}/disk-usage.txt" 2>&1 || na "${OUT_DIR}/disk-usage.txt"
if command -v free >/dev/null; then free -h >"${OUT_DIR}/memory-usage.txt" 2>&1; else na "${OUT_DIR}/memory-usage.txt"; fi
{ uptime; echo; cat /proc/loadavg 2>/dev/null || true; nproc 2>/dev/null || true; } >"${OUT_DIR}/cpu-load.txt" 2>&1 || na "${OUT_DIR}/cpu-load.txt"
{ ss -ltn 2>/dev/null || netstat -ltn 2>/dev/null || echo "NOT AVAILABLE"; } >"${OUT_DIR}/ports.txt" 2>&1

# 15 Health
if command -v curl >/dev/null 2>&1; then
  curl -fsS --max-time 10 "http://127.0.0.1:${HTTP_PORT:-80}/health" >"${OUT_DIR}/health-edge.txt" 2>&1 \
    || curl -fsS --max-time 10 "http://127.0.0.1:3000/api/system-health" >"${OUT_DIR}/health-app.json" 2>&1 \
    || na "${OUT_DIR}/health-app.json"
  if [[ -f "${ENV_FILE}" ]] && command -v docker >/dev/null; then
    compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/system-health').then(r=>r.text()).then(t=>console.log(t)).catch(e=>{console.error(e);process.exit(1)})" \
      >"${OUT_DIR}/health-system.json" 2>&1 || na "${OUT_DIR}/health-system.json"
  fi
else
  na "${OUT_DIR}/health-app.json"
fi
if [[ -f "${OUT_DIR}/health-system.json" ]]; then
  sanitize_stream <"${OUT_DIR}/health-system.json" >"${OUT_DIR}/health-system.sanitized.json" || true
fi

# 16 Migration
if [[ -f "${ENV_FILE}" ]] && command -v docker >/dev/null; then
  compose exec -T postgres psql -U "${POSTGRES_USER:-kodikz}" -d "${POSTGRES_DB:-giscd}" -c \
    "SELECT version FROM schema_migrations ORDER BY version;" \
    >"${OUT_DIR}/migration-status.txt" 2>&1 || na "${OUT_DIR}/migration-status.txt"
else
  na "${OUT_DIR}/migration-status.txt"
fi

# 17 Backups
{
  ls -lt "${PKG_ROOT}/data/backups" 2>/dev/null | head -20 || echo "NOT AVAILABLE: no backups directory listing"
} >"${OUT_DIR}/backup-status.txt"

# 19 Summary
{
  echo "Kodikz Support Bundle Summary"
  echo "Bundle: ${BUNDLE_NAME}"
  echo "Product: ${PRODUCT_NAME}"
  echo "Version: ${APP_VERSION} / ${RELEASE_CHANNEL} / ${GIT_TAG}"
  echo "Commit: ${GIT_COMMIT}"
  echo "Log window: since=${LOG_SINCE} maxLines=${LOG_LINES}"
  echo "Sanitized: yes"
  echo "Secrets: not included"
  echo "Database contents: not included"
  echo "Private keys: not included"
  echo "Created: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
} >"${OUT_DIR}/SUPPORT-SUMMARY.txt"

# Sanitize all text files once more
find "${OUT_DIR}" -type f \( -name '*.txt' -o -name '*.json' -o -name '*.log' \) -print0 |
  while IFS= read -r -d '' f; do
    tmp="${f}.san"
    sanitize_stream <"${f}" >"${tmp}" && mv "${tmp}" "${f}"
  done

# 20 Compress
FINAL="${SUPPORT_DIR}/${BUNDLE_NAME}.tar.gz"
if tar -C "${TMP}" -czf "${FINAL}" "${BUNDLE_NAME}"; then
  chmod 600 "${FINAL}"
else
  rm -rf "${TMP}"
  die "Failed to compress support bundle"
fi

# 21 Remove temp
rm -rf "${TMP}"

SIZE="$(wc -c <"${FINAL}" | tr -d ' ')"
audit "support bundle created ${FINAL} size=${SIZE}"
result_line PASS "Support bundle created"
echo ""
echo "Bundle: ${FINAL}"
echo "Size bytes: ${SIZE}"
echo "Permissions: 600"
next_action "Transmit the bundle to Kodikz via the secure channel in OPERATOR-SUPPORT-GUIDE.md"
exit 0
