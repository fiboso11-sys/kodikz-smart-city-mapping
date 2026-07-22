#!/usr/bin/env bash
# Preflight checks for Dubai Ubuntu deployment host.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Preflight"
load_version
audit "preflight start"

MIN_CPU=4
MIN_RAM_MB=7500
MIN_DISK_GB=150
PASS=0
WARN=0
FAIL=0
CHECKS=()

record() {
  local status="$1" name="$2" detail="$3"
  CHECKS+=("${status}|${name}|${detail}")
  case "${status}" in
    PASS) PASS=$((PASS + 1)); echo "[PASS] ${name}: ${detail}" ;;
    WARNING) WARN=$((WARN + 1)); echo "[WARNING] ${name}: ${detail}" ;;
    FAIL) FAIL=$((FAIL + 1)); echo "[FAIL] ${name}: ${detail}" ;;
  esac
}

# OS
if [[ "$(uname -s)" != "Linux" ]]; then
  record FAIL "Operating system" "Expected Linux, got $(uname -s)"
else
  record PASS "Operating system" "Linux"
fi

if [[ -f /etc/os-release ]]; then
  # shellcheck disable=SC1091
  source /etc/os-release
  if [[ "${ID:-}" == "ubuntu" ]] && { [[ "${VERSION_ID:-}" == "22.04" ]] || [[ "${VERSION_ID:-}" == "24.04" ]]; }; then
    record PASS "Ubuntu version" "${PRETTY_NAME}"
  else
    record FAIL "Ubuntu version" "Need Ubuntu 22.04 or 24.04 LTS (got ${PRETTY_NAME:-unknown})"
  fi
else
  record FAIL "Ubuntu version" "/etc/os-release missing"
fi

CPU="$(nproc 2>/dev/null || echo 0)"
if (( CPU >= MIN_CPU )); then
  record PASS "CPU count" "${CPU} vCPU (min ${MIN_CPU})"
else
  record FAIL "CPU count" "${CPU} vCPU (min ${MIN_CPU})"
fi

RAM_KB="$(awk '/MemTotal/ {print $2}' /proc/meminfo 2>/dev/null || echo 0)"
RAM_MB=$((RAM_KB / 1024))
if (( RAM_MB >= MIN_RAM_MB )); then
  record PASS "Available RAM" "${RAM_MB} MB (min ~8 GB)"
else
  record FAIL "Available RAM" "${RAM_MB} MB (min ~8 GB / ${MIN_RAM_MB} MB)"
fi

DISK_GB="$(df -BG --output=avail "${PKG_ROOT}" 2>/dev/null | tail -1 | tr -dc '0-9' || echo 0)"
if (( DISK_GB >= MIN_DISK_GB )); then
  record PASS "Available disk" "${DISK_GB} GB free (min ${MIN_DISK_GB} GB)"
else
  record FAIL "Available disk" "${DISK_GB} GB free (min ${MIN_DISK_GB} GB)"
fi

if command -v docker >/dev/null 2>&1; then
  record PASS "Docker Engine" "$(docker --version | redact)"
else
  record FAIL "Docker Engine" "docker not found"
fi

if docker compose version >/dev/null 2>&1; then
  record PASS "Docker Compose plugin" "$(docker compose version | head -1)"
else
  record FAIL "Docker Compose plugin" "docker compose not available"
fi

if docker info >/dev/null 2>&1; then
  record PASS "Docker daemon access" "OK"
else
  record FAIL "Docker daemon access" "Cannot talk to Docker daemon (permissions or service down)"
fi

DEPLOY_MODE="${DEPLOYMENT_MODE_HINT:-offline}"
if [[ -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  set +u
  source "${ENV_FILE}" 2>/dev/null || true
  set -u
  DEPLOY_MODE="${IMAGE_SOURCE:-${DEPLOY_MODE}}"
fi

if [[ "${DEPLOY_MODE}" == "registry" ]]; then
  if curl -fsS --max-time 5 https://registry-1.docker.io/v2/ >/dev/null 2>&1 \
    || curl -fsS --max-time 5 https://1.1.1.1 >/dev/null 2>&1; then
    record PASS "Internet / registry reachability" "Outbound HTTPS OK"
  else
    record FAIL "Internet / registry reachability" "Registry mode selected but network unreachable"
  fi
else
  if [[ -f "${PKG_ROOT}/images/kodikz-rc1-${APP_VERSION}-images.tar" ]]; then
    record PASS "Offline image bundle" "Found images/kodikz-rc1-${APP_VERSION}-images.tar"
  else
    record WARNING "Offline image bundle" "Missing images tar — run build-images.sh on a Docker build host, or set IMAGE_SOURCE=registry"
  fi
fi

for c in curl openssl sha256sum awk df free; do
  if command -v "${c}" >/dev/null 2>&1; then
    record PASS "Utility ${c}" "present"
  else
    record FAIL "Utility ${c}" "missing"
  fi
done

check_port() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    if ss -ltn "( sport = :${port} )" 2>/dev/null | grep -q ":${port}"; then
      return 1
    fi
  elif command -v netstat >/dev/null 2>&1; then
    if netstat -ltn 2>/dev/null | grep -q ":${port} "; then
      return 1
    fi
  fi
  return 0
}

for port in 80 443; do
  if check_port "${port}"; then
    record PASS "Port ${port}" "available"
  else
    record WARNING "Port ${port}" "already in use — confirm it is this installation or free the port"
  fi
done

for bad in 5432 9000 9001 3000; do
  if check_port "${bad}"; then
    record PASS "Port ${bad} not published conflict" "host listener free (good — keep DB/MinIO/app private)"
  else
    record WARNING "Port ${bad}" "something listens on host — ensure it is not publicly exposed"
  fi
done

if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -Eq 'kodikz|giscd'; then
  record WARNING "Existing containers" "Kodikz-related containers detected — deploy will require confirmation"
else
  record PASS "Existing containers" "No conflicting Kodikz container names detected"
fi

if getent hosts registry-1.docker.io >/dev/null 2>&1 || getent hosts 1.1.1.1 >/dev/null 2>&1; then
  record PASS "DNS resolution" "OK"
else
  record WARNING "DNS resolution" "getent hosts failed — verify resolv.conf"
fi

if timedatectl show -p NTPSynchronized --value 2>/dev/null | grep -qi yes; then
  record PASS "Time synchronization" "NTP synchronized"
elif command -v chronyc >/dev/null 2>&1 && chronyc tracking 2>/dev/null | grep -qi 'leap status.*normal'; then
  record PASS "Time synchronization" "chrony OK"
else
  record WARNING "Time synchronization" "Could not confirm NTP — set Asia/Dubai or UTC + enable chrony/timesyncd"
fi

if [[ -w "${PKG_ROOT}" ]]; then
  record PASS "Write permission" "${PKG_ROOT} writable"
else
  record FAIL "Write permission" "${PKG_ROOT} not writable"
fi

for f in VERSION scripts/_lib.sh deploy/docker-compose.plugplay.yml; do
  if [[ -f "${PKG_ROOT}/${f}" ]]; then
    record PASS "Package file ${f}" "present"
  else
    record FAIL "Package file ${f}" "missing"
  fi
done

if [[ -f "${PKG_ROOT}/CHECKSUMS.sha256" ]]; then
  if (cd "${PKG_ROOT}" && sha256sum -c CHECKSUMS.sha256 --quiet 2>/dev/null); then
    record PASS "Checksums" "CHECKSUMS.sha256 verified"
  else
    record WARNING "Checksums" "CHECKSUMS.sha256 present but verification incomplete (regenerate after package finalize)"
  fi
else
  record WARNING "Checksums" "CHECKSUMS.sha256 not yet generated"
fi

# Reports
JSON="${REPORT_DIR}/preflight-report.json"
MD="${REPORT_DIR}/PREFLIGHT-REPORT.md"
{
  echo "{"
  echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"version\": \"${APP_VERSION}\","
  echo "  \"pass\": ${PASS},"
  echo "  \"warning\": ${WARN},"
  echo "  \"fail\": ${FAIL},"
  echo "  \"result\": \"$([ ${FAIL} -eq 0 ] && echo PASS || echo FAIL)\","
  echo "  \"checks\": ["
  first=1
  for row in "${CHECKS[@]}"; do
    IFS='|' read -r st name detail <<<"${row}"
    detail_esc="${detail//\"/\\\"}"
    name_esc="${name//\"/\\\"}"
    [[ ${first} -eq 1 ]] || echo ","
    first=0
    printf '    {"status":"%s","name":"%s","detail":"%s"}' "${st}" "${name_esc}" "${detail_esc}"
  done
  echo ""
  echo "  ]"
  echo "}"
} >"${JSON}"

{
  echo "# Preflight Report"
  echo ""
  echo "- Version: ${APP_VERSION}"
  echo "- Timestamp (UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- PASS: ${PASS} · WARNING: ${WARN} · FAIL: ${FAIL}"
  echo ""
  echo "| Status | Check | Detail |"
  echo "|--------|-------|--------|"
  for row in "${CHECKS[@]}"; do
    IFS='|' read -r st name detail <<<"${row}"
    echo "| ${st} | ${name} | ${detail} |"
  done
  echo ""
  if (( FAIL > 0 )); then
    echo "**Result: FAIL — deployment blocked**"
  else
    echo "**Result: PASS — proceed to configure**"
  fi
} >"${MD}"

audit "preflight done pass=${PASS} warn=${WARN} fail=${FAIL}"

if (( FAIL > 0 )); then
  echo ""
  echo "PREFLIGHT FAILED (${FAIL} failure(s)). See ${MD}"
  next_action "Fix FAIL items, then re-run ./scripts/preflight.sh"
  exit 1
fi

echo ""
echo "PREFLIGHT PASSED (${WARN} warning(s)). Reports: ${MD}"
next_action "Run ./scripts/configure.sh"
exit 0
