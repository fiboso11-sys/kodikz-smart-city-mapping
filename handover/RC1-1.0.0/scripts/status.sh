#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: System status"
load_version
audit "status"

OVERALL="HEALTHY"
EXIT_CODE=0

if [[ -f "${ENV_FILE}" ]]; then
  load_env || true
fi

echo "Product version : ${APP_VERSION}"
echo "Release tag     : ${GIT_TAG}"
echo "Commit SHA      : ${GIT_COMMIT}"
echo "Release channel : ${RELEASE_CHANNEL}"
echo "App image       : ${APP_IMAGE}"
echo "Worker image    : ${WORKER_IMAGE}"
echo "Image digest    : ${APP_IMAGE_DIGEST:-REQUIRES_DOCKER_BUILD_HOST}"
if [[ -f "${REPORT_DIR}/deployment-report.json" ]]; then
  echo "Deploy report   : present"
  grep -E 'timestamp|deployedVersion' "${REPORT_DIR}/deployment-report.json" 2>/dev/null | head -5 || true
else
  echo "Deploy report   : NOT AVAILABLE"
fi
echo ""

echo "=== Containers ==="
if [[ -f "${ENV_FILE}" ]] && command -v docker >/dev/null 2>&1; then
  compose ps 2>&1 | redact || true
  for svc in postgres app; do
    if ! compose ps --status running "${svc}" 2>/dev/null | grep -q "${svc}"; then
      OVERALL="UNAVAILABLE"
      EXIT_CODE=1
    fi
  done
else
  echo "NOT AVAILABLE (compose/env)"
  OVERALL="UNKNOWN"
fi

echo ""
echo "=== Application health ==="
APP_HEALTH="NOT AVAILABLE"
if [[ -f "${ENV_FILE}" ]] && command -v docker >/dev/null 2>&1; then
  if compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/system-health').then(async r=>{const j=await r.json(); console.log(j.status||'unknown'); process.exit(r.ok||r.status===503?0:1)}).catch(()=>process.exit(1))" 2>/dev/null; then
    APP_HEALTH="$(compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/system-health').then(r=>r.json()).then(j=>console.log(j.status||'unknown')).catch(()=>console.log('unavailable'))" 2>/dev/null | tail -1)"
  else
    APP_HEALTH="unavailable"
    OVERALL="DEGRADED"
  fi
fi
echo "Application health: ${APP_HEALTH}"

echo ""
echo "=== Database / migration ==="
if [[ -f "${ENV_FILE}" ]] && command -v docker >/dev/null 2>&1; then
  if compose exec -T postgres pg_isready -U "${POSTGRES_USER:-kodikz}" -d "${POSTGRES_DB:-giscd}" >/dev/null 2>&1; then
    echo "Database status: healthy"
    compose exec -T postgres psql -U "${POSTGRES_USER:-kodikz}" -d "${POSTGRES_DB:-giscd}" -tAc \
      "SELECT COALESCE(MAX(version)::text,'none') FROM schema_migrations;" 2>/dev/null \
      | awk '{print "Migration version: "$0}' || echo "Migration version: NOT AVAILABLE"
  else
    echo "Database status: unavailable"
    OVERALL="UNAVAILABLE"
    EXIT_CODE=1
  fi
else
  echo "Database status: NOT AVAILABLE"
fi

echo ""
echo "=== Integrations (optional) ==="
GPS_URL="${NEXT_PUBLIC_API_URL:-${GPS_BACKEND_URL:-}}"
if [[ -n "${GPS_URL}" ]] && command -v curl >/dev/null; then
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "${GPS_URL}/health" 2>/dev/null || echo 000)"
  if [[ "${code}" =~ ^2 ]]; then
    echo "GPS backend: healthy (HTTP ${code})"
    echo "Socket.IO host: reachable hint via GPS health"
  else
    echo "GPS / Socket.IO: degraded or not reachable (HTTP ${code}) — optional external"
    [[ "${OVERALL}" == "HEALTHY" ]] && OVERALL="DEGRADED"
  fi
else
  echo "GPS / Socket.IO: NOT CONFIGURED or NOT AVAILABLE (does not force UNAVAILABLE)"
fi

echo ""
echo "=== Backups ==="
ls -lt "${PKG_ROOT}/data/backups" 2>/dev/null | head -5 || echo "No backups yet"

echo ""
echo "=== Host resources ==="
df -h "${PKG_ROOT}" 2>/dev/null | tail -1 || true
if command -v free >/dev/null; then free -h | head -2; fi
uptime 2>/dev/null || true

echo ""
echo "SYSTEM ${OVERALL}"
if [[ "${EXIT_CODE}" -eq 0 ]]; then
  result_line PASS "SYSTEM ${OVERALL}"
  next_action "Use ./scripts/support.sh if escalating to Kodikz"
else
  result_line FAIL "SYSTEM ${OVERALL}"
  next_action "Inspect ./scripts/logs.sh and TROUBLESHOOTING.md"
fi
exit "${EXIT_CODE}"
