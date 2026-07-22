#!/usr/bin/env bash
# One-command deployment for RC1 plug-and-play package.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Deploy"
load_version
audit "deploy start"

SKIP_PREFLIGHT=0
YES=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-preflight) SKIP_PREFLIGHT=1 ;;
    --yes|-y) YES=1 ;;
    *) die "Unknown arg: $1" ;;
  esac
  shift
done

step() { echo ""; echo ">>> $*"; audit "step $*"; }

# 1 Preflight
if [[ "${SKIP_PREFLIGHT}" -eq 0 ]]; then
  step "1/18 Preflight"
  "${SCRIPT_DIR}/preflight.sh"
else
  echo "Skipping preflight (--skip-preflight)"
fi

# 2 Config
step "2/18 Validate configuration"
"${SCRIPT_DIR}/validate-config.sh"
load_env

# 3 Release identity
step "3/18 Verify release identity"
[[ "${APP_VERSION}" == "1.0.0-rc1" ]] || die "Unexpected APP_VERSION ${APP_VERSION}"
[[ "${GIT_COMMIT}" == "8612a33f03db738cffc0bfd6bd089abe3f8fd414" ]] || \
  echo "WARNING: VERSION GIT_COMMIT differs from freeze SHA — confirm intentional"

# 4 Checksums
step "4/18 Verify SHA-256 checksums"
if [[ -f "${PKG_ROOT}/CHECKSUMS.sha256" ]]; then
  (cd "${PKG_ROOT}" && sha256sum -c CHECKSUMS.sha256) || die "Checksum verification failed"
else
  echo "WARNING: CHECKSUMS.sha256 missing — continuing with warning"
fi

# Existing install detection
EXISTING=0
if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q 'kodikz'; then
  EXISTING=1
fi
if [[ -f "${PKG_ROOT}/reports/deployment-report.json" ]]; then
  EXISTING=1
fi

if [[ "${EXISTING}" -eq 1 ]]; then
  step "Existing installation detected"
  PREV="$(grep -E 'APP_VERSION|deployedVersion' "${PKG_ROOT}/reports/deployment-report.json" 2>/dev/null | head -1 || echo unknown)"
  echo "Previous marker: ${PREV}"
  if [[ "${YES}" -ne 1 ]]; then
    confirm "Create backup and continue with deploy?" || die "Deploy aborted by operator"
  fi
  step "Pre-replace backup"
  "${SCRIPT_DIR}/backup.sh" || die "Backup failed — deploy aborted to protect data"
  mkdir -p "${PKG_ROOT}/reports/rollback"
  cp -a "${PKG_ROOT}/VERSION" "${PKG_ROOT}/reports/rollback/VERSION.pre-deploy.$(date -u +%Y%m%d%H%M%S)" || true
fi

# 5 Persistent dirs
step "5/18 Create persistent directories"
mkdir -p "${PKG_ROOT}/data/postgres" "${PKG_ROOT}/data/minio" "${PKG_ROOT}/data/backups" \
  "${PKG_ROOT}/data/certs" "${PKG_ROOT}/logs" "${PKG_ROOT}/reports"
# Do not wipe data dirs

# 6 Networks (compose creates)
step "6/18 Docker networks"
docker network inspect kodikz_rc1_net >/dev/null 2>&1 || docker network create kodikz_rc1_net

# 7 Images
step "7/18 Load or pull images"
case "${IMAGE_SOURCE}" in
  offline)
    TAR="${PKG_ROOT}/images/kodikz-rc1-${APP_VERSION}-images.tar"
    [[ -f "${TAR}" ]] || die "Offline bundle missing: ${TAR} (REQUIRES DOCKER BUILD HOST to create)"
    docker load -i "${TAR}"
    ;;
  registry)
    docker pull "${APP_IMAGE}"
    docker pull "${WORKER_IMAGE}"
    docker pull postgres:16-alpine
    docker pull nginx:1.27-alpine
    docker pull minio/minio:RELEASE.2024-10-13T13-34-11Z
    ;;
  *) die "Invalid IMAGE_SOURCE" ;;
esac

# Record digests if available
{
  echo "recorded_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "app_id=$(docker image inspect --format='{{.Id}}' "${APP_IMAGE}" 2>/dev/null || echo MISSING)"
  echo "worker_id=$(docker image inspect --format='{{.Id}}' "${WORKER_IMAGE}" 2>/dev/null || echo MISSING)"
} >"${PKG_ROOT}/images/DEPLOYED-DIGESTS.txt"

# 8 Start DB + support
step "8/18 Start database and supporting services"
compose up -d postgres minio

# 9 Wait health
step "9/18 Wait for service health"
for i in $(seq 1 60); do
  pg_ok=0
  mn_ok=0
  compose ps postgres 2>/dev/null | grep -qi healthy && pg_ok=1 || true
  compose ps minio 2>/dev/null | grep -qi healthy && mn_ok=1 || true
  if [[ "${pg_ok}" -eq 1 && "${mn_ok}" -eq 1 ]]; then
    break
  fi
  sleep 5
done
compose ps postgres | grep -qi healthy || die "PostgreSQL not healthy"
compose ps minio | grep -qi healthy || die "MinIO not healthy"

# 10 Migrations
step "10/18 Run database migrations"
"${SCRIPT_DIR}/migrate.sh"

# 11 Validate migration
step "11/18 Validate migration state"
"${SCRIPT_DIR}/migration-status.sh"

# 12 Backend/app
step "12/18 Start application (backend+UI) and worker"
compose up -d app worker

# 13 Wait readiness
step "13/18 Wait for backend health and readiness"
for i in $(seq 1 60); do
  if compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/readiness').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    break
  fi
  sleep 5
done
compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" \
  || die "Backend health check failed"
compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/readiness').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" \
  || die "Backend readiness check failed"

# 14 Frontend via nginx
step "14/18 Start frontend edge (nginx)"
if [[ "${TLS_MODE}" == "http-only" ]]; then
  echo "WARNING: TLS_MODE=http-only — ensure Dubai provides external TLS or accepts HTTP pilot risk"
fi
compose up -d nginx || echo "WARNING: nginx start issue — check TLS certs under ${TLS_CERT_DIR}"

# 15 Frontend response
step "15/18 Verify frontend response"
FRONT_OK=0
if curl -fsS -o /dev/null -w "%{http_code}" --max-time 15 "http://127.0.0.1:${HTTP_PORT:-80}/health" 2>/dev/null | grep -qE '200|301|302'; then
  FRONT_OK=1
fi
if [[ "${FRONT_OK}" -eq 0 ]]; then
  # Try direct app port inside network
  compose exec -T app node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))" \
    || die "Frontend response failed"
  echo "WARNING: Edge HTTP check inconclusive; in-container app root OK"
fi

# 16 Socket.IO / WebSocket route (GPS external)
step "16/18 Verify Socket.IO/WebSocket route"
if curl -fsS --max-time 10 -o /dev/null -w "%{http_code}" "${NEXT_PUBLIC_SOCKET_URL}/socket.io/?EIO=4&transport=polling" 2>/dev/null | grep -qE '200|400|401'; then
  echo "GPS Socket.IO endpoint reachable (HTTP probe)"
else
  echo "WARNING: Could not probe GPS Socket.IO at ${NEXT_PUBLIC_SOCKET_URL} — REQUIRES DUBAI NETWORK / GPS VALIDATION"
fi

# 17 Digests already recorded
step "17/18 Recorded image digests -> images/DEPLOYED-DIGESTS.txt"

# 18 Report
step "18/18 Generate deployment report"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
MD="${REPORT_DIR}/DEPLOYMENT-REPORT.md"
JSON="${REPORT_DIR}/deployment-report.json"
{
  echo "# Deployment Report"
  echo ""
  echo "- Timestamp (UTC): ${TS}"
  echo "- Version: ${APP_VERSION}"
  echo "- Git tag: ${GIT_TAG}"
  echo "- Git commit: ${GIT_COMMIT}"
  echo "- Image source: ${IMAGE_SOURCE}"
  echo "- APP_IMAGE: ${APP_IMAGE}"
  echo "- WORKER_IMAGE: ${WORKER_IMAGE}"
  echo "- Result: DEPLOY COMPLETED (run validate.sh for runtime certification)"
  echo ""
  echo "## Next"
  echo "./scripts/validate.sh"
} >"${MD}"
{
  echo "{"
  echo "  \"timestamp\": \"${TS}\","
  echo "  \"deployedVersion\": \"${APP_VERSION}\","
  echo "  \"gitCommit\": \"${GIT_COMMIT}\","
  echo "  \"imageSource\": \"${IMAGE_SOURCE}\","
  echo "  \"appImage\": \"${APP_IMAGE}\","
  echo "  \"workerImage\": \"${WORKER_IMAGE}\","
  echo "  \"status\": \"deployed\""
  echo "}"
} >"${JSON}"

audit "deploy complete"
echo ""
echo "DEPLOYMENT SCRIPT FINISHED. See ${MD}"
next_action "Run ./scripts/validate.sh"
exit 0
