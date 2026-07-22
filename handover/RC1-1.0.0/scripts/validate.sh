#!/usr/bin/env bash
# Runtime validation — does not fabricate success.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Runtime validation"
load_version
load_env
audit "validate start"

PASS=0
WARN=0
FAIL=0
NA=0
ROWS=()

rec() {
  local st="$1" name="$2" detail="$3"
  ROWS+=("${st}|${name}|${detail}")
  case "${st}" in
    PASS) PASS=$((PASS+1)); echo "[PASS] ${name}: ${detail}" ;;
    WARNING) WARN=$((WARN+1)); echo "[WARNING] ${name}: ${detail}" ;;
    FAIL) FAIL=$((FAIL+1)); echo "[FAIL] ${name}: ${detail}" ;;
    NOT_APPLICABLE) NA=$((NA+1)); echo "[NOT APPLICABLE] ${name}: ${detail}" ;;
  esac
}

# Containers
if compose ps >/dev/null 2>&1; then
  for svc in postgres minio app worker; do
    if compose ps --status running "${svc}" 2>/dev/null | grep -q "${svc}"; then
      rec PASS "Container ${svc}" "running"
    else
      rec FAIL "Container ${svc}" "not running"
    fi
  done
  if compose ps nginx 2>/dev/null | grep -q nginx; then
    rec PASS "Container nginx" "present"
  else
    rec WARNING "Container nginx" "not running"
  fi
else
  rec FAIL "Compose" "cannot query services — REQUIRES DUBAI SERVER RUNTIME"
fi

# Health
if compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
  rec PASS "Backend health" "/api/health OK"
else
  rec FAIL "Backend health" "failed"
fi

if compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/readiness').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
  rec PASS "Backend readiness" "/api/readiness OK"
else
  rec FAIL "Backend readiness" "failed"
fi

# Frontend HTTP
code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "http://127.0.0.1:${HTTP_PORT:-80}/health" 2>/dev/null || echo 000)"
if [[ "${code}" =~ ^(200|301|302)$ ]]; then
  rec PASS "Frontend HTTP" "edge /health -> ${code}"
else
  if compose exec -T app node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    rec WARNING "Frontend HTTP" "edge ${code}; in-container app OK"
  else
    rec FAIL "Frontend HTTP" "edge ${code} and app unavailable"
  fi
fi

# Postgres
if compose exec -T postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
  rec PASS "PostgreSQL connectivity" "pg_isready OK"
else
  rec FAIL "PostgreSQL connectivity" "not ready"
fi

# Migrations
if compose exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -tAc "SELECT 1 FROM schema_migrations LIMIT 1" 2>/dev/null | grep -q 1; then
  rec PASS "Migration state" "schema_migrations has rows"
else
  rec FAIL "Migration state" "schema_migrations empty or missing"
fi

# Auth endpoint
acode="$(compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).then(r=>{console.log(r.status);process.exit(0)}).catch(()=>process.exit(1))" 2>/dev/null | tr -dc '0-9' || echo 000)"
if [[ "${acode}" =~ ^(400|401|405|422)$ ]]; then
  rec PASS "Authentication endpoint" "reachable (HTTP ${acode})"
elif [[ "${acode}" == "200" ]]; then
  rec WARNING "Authentication endpoint" "unexpected 200 on empty body"
else
  rec FAIL "Authentication endpoint" "unexpected ${acode}"
fi

# Socket.IO GPS
scode="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "${NEXT_PUBLIC_SOCKET_URL}/socket.io/?EIO=4&transport=polling" 2>/dev/null || echo 000)"
if [[ "${scode}" =~ ^(200|400|401)$ ]]; then
  rec PASS "Socket.IO/WebSocket (GPS)" "probe HTTP ${scode}"
else
  rec WARNING "Socket.IO/WebSocket (GPS)" "probe ${scode} — REQUIRES DUBAI NETWORK / GPS VALIDATION"
fi

# GPS backend
gcode="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "${NEXT_PUBLIC_API_URL}" 2>/dev/null || echo 000)"
if [[ "${gcode}" != "000" ]]; then
  rec PASS "GPS backend connectivity" "HTTP ${gcode}"
else
  rec WARNING "GPS backend connectivity" "unreachable from this host"
fi

# Object storage
if compose exec -T minio curl -fsS http://127.0.0.1:9000/minio/health/live >/dev/null 2>&1; then
  rec PASS "Object-storage connectivity" "MinIO live"
else
  rec FAIL "Object-storage connectivity" "MinIO health failed"
fi

# Volumes
if [[ -d "${POSTGRES_DATA_DIR:-${PKG_ROOT}/data/postgres}" ]]; then
  rec PASS "Persistent volume postgres" "directory present"
else
  rec FAIL "Persistent volume postgres" "missing"
fi
if [[ -d "${MINIO_DATA_DIR:-${PKG_ROOT}/data/minio}" ]]; then
  rec PASS "Persistent volume minio" "directory present"
else
  rec FAIL "Persistent volume minio" "missing"
fi

# Restart persistence — informational only unless --deep
rec NOT_APPLICABLE "Restart persistence" "Not exercised in this pass — run restart.sh then re-validate on Dubai host"

# HTTPS
case "${TLS_MODE}" in
  http-only)
    rec NOT_APPLICABLE "HTTPS" "TLS_MODE=http-only"
    ;;
  *)
    hcode="$(curl -skS -o /dev/null -w '%{http_code}' --max-time 15 "https://127.0.0.1:${HTTPS_PORT:-443}/health" 2>/dev/null || echo 000)"
    if [[ "${hcode}" =~ ^(200|301|302)$ ]]; then
      rec PASS "HTTPS" "local probe ${hcode}"
    else
      rec WARNING "HTTPS" "local probe ${hcode} — check certs / REQUIRES DUBAI SERVER VALIDATION"
    fi
    ;;
esac

# CORS — config presence only
if [[ -n "${CORS_ORIGINS:-}" ]]; then
  rec PASS "CORS config" "CORS_ORIGINS set (runtime browser check on Dubai)"
else
  rec WARNING "CORS config" "CORS_ORIGINS empty"
fi

DISK_GB="$(df -BG --output=avail "${PKG_ROOT}" 2>/dev/null | tail -1 | tr -dc '0-9' || echo 0)"
if (( DISK_GB >= 20 )); then
  rec PASS "Disk availability" "${DISK_GB} GB free"
else
  rec FAIL "Disk availability" "${DISK_GB} GB free"
fi

RAM_MB=$(( $(awk '/MemAvailable/{print $2}' /proc/meminfo 2>/dev/null || echo 0) / 1024 ))
if (( RAM_MB >= 1024 )); then
  rec PASS "Memory availability" "${RAM_MB} MB available"
else
  rec WARNING "Memory availability" "${RAM_MB} MB available"
fi

if [[ -x "${SCRIPT_DIR}/backup.sh" ]]; then
  rec PASS "Backup command readiness" "backup.sh executable"
else
  rec FAIL "Backup command readiness" "backup.sh missing"
fi

# Final
if (( FAIL > 0 )); then
  RESULT="DEPLOYMENT FAILED"
elif (( WARN > 0 )); then
  RESULT="DEPLOYMENT VALIDATED WITH WARNINGS"
else
  RESULT="DEPLOYMENT VALIDATED"
fi

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
MD="${REPORT_DIR}/RUNTIME-VALIDATION-REPORT.md"
JSON="${REPORT_DIR}/runtime-validation-report.json"

{
  echo "# Runtime Validation Report"
  echo ""
  echo "- Timestamp: ${TS}"
  echo "- Version: ${APP_VERSION}"
  echo "- PASS: ${PASS} · WARNING: ${WARN} · FAIL: ${FAIL} · N/A: ${NA}"
  echo "- **${RESULT}**"
  echo ""
  echo "| Status | Check | Detail |"
  echo "|--------|-------|--------|"
  for row in "${ROWS[@]}"; do
    IFS='|' read -r st name detail <<<"${row}"
    echo "| ${st} | ${name} | ${detail} |"
  done
} >"${MD}"

{
  echo "{"
  echo "  \"timestamp\": \"${TS}\","
  echo "  \"version\": \"${APP_VERSION}\","
  echo "  \"pass\": ${PASS},"
  echo "  \"warning\": ${WARN},"
  echo "  \"fail\": ${FAIL},"
  echo "  \"notApplicable\": ${NA},"
  echo "  \"result\": \"${RESULT}\""
  echo "}"
} >"${JSON}"

audit "validate result=${RESULT}"
echo ""
echo "${RESULT}"
echo "Report: ${MD}"

if [[ "${RESULT}" == "DEPLOYMENT FAILED" ]]; then
  next_action "See TROUBLESHOOTING.md and fix FAIL items"
  exit 1
fi
next_action "Proceed to joint acceptance checklist"
exit 0
