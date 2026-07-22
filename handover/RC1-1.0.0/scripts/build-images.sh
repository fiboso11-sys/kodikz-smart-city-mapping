#!/usr/bin/env bash
# Build and optionally export RC1 immutable images.
# REQUIRES DOCKER BUILD HOST (Docker Engine available).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Package scripts live in handover/RC1-1.0.0/scripts — repo root is ../../../
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
PKG_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"
load_version

heading "Build RC1 images ${APP_VERSION}"
require_cmd docker
command -v docker >/dev/null

cd "${REPO_ROOT}"
audit "build start commit=${GIT_COMMIT}"

BUILD_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Single full-stack app image (UI + Survey API). No duplicate frontend/backend images.
docker build --target runner -t "${APP_IMAGE}" \
  --build-arg "KODIKZ_GIT_COMMIT=${GIT_COMMIT}" \
  --label "org.opencontainers.image.revision=${GIT_COMMIT}" \
  --label "org.opencontainers.image.version=${APP_VERSION}" \
  .

docker build --target worker -t "${WORKER_IMAGE}" \
  --label "org.opencontainers.image.revision=${GIT_COMMIT}" \
  --label "org.opencontainers.image.version=${APP_VERSION}" \
  .

APP_DIGEST="$(docker image inspect --format='{{index .RepoDigests 0}}' "${APP_IMAGE}" 2>/dev/null || docker image inspect --format='{{.Id}}' "${APP_IMAGE}")"
WORKER_DIGEST="$(docker image inspect --format='{{index .RepoDigests 0}}' "${WORKER_IMAGE}" 2>/dev/null || docker image inspect --format='{{.Id}}' "${WORKER_IMAGE}")"

mkdir -p "${PKG_ROOT}/images"
{
  echo "APP_IMAGE=${APP_IMAGE}"
  echo "WORKER_IMAGE=${WORKER_IMAGE}"
  echo "APP_IMAGE_DIGEST=${APP_DIGEST}"
  echo "WORKER_IMAGE_DIGEST=${WORKER_DIGEST}"
  echo "BUILD_TIMESTAMP=${BUILD_TS}"
  echo "GIT_COMMIT=${GIT_COMMIT}"
  echo "IMAGE_ARCH=linux/amd64"
  echo "RUNTIME_USER=kodikz"
  echo "APP_PORT=3000"
  echo "HEALTHCHECK_PATH=/api/health"
  echo "ARCHITECTURE=full-stack-nextjs-single-image"
} | tee "${PKG_ROOT}/images/IMAGE-IDENTITY.txt"

# Offline bundle (optional)
EXPORT="${PKG_ROOT}/images/kodikz-rc1-${APP_VERSION}-images.tar"
docker save -o "${EXPORT}" "${APP_IMAGE}" "${WORKER_IMAGE}" postgres:16-alpine nginx:1.27-alpine minio/minio:RELEASE.2024-10-13T13-34-11Z
sha256sum "${EXPORT}" >"${EXPORT}.sha256"

# Patch VERSION digests in package (non-secret)
sed -i.bak \
  -e "s|^APP_IMAGE_DIGEST=.*|APP_IMAGE_DIGEST=${APP_DIGEST}|" \
  -e "s|^WORKER_IMAGE_DIGEST=.*|WORKER_IMAGE_DIGEST=${WORKER_DIGEST}|" \
  -e "s|^BUILD_TIMESTAMP=.*|BUILD_TIMESTAMP=${BUILD_TS}|" \
  "${PKG_ROOT}/VERSION" && rm -f "${PKG_ROOT}/VERSION.bak"

audit "build complete app=${APP_DIGEST}"
echo "Images built and exported to ${EXPORT}"
next_action "Transfer package to Dubai host, then run ./scripts/preflight.sh"
