#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/_lib.sh"

release_banner
heading "ACTION: Logs"
load_version
load_env

SVC="${1:-all}"
LINES="${2:-200}"

# Never dump env files
case "${SVC}" in
  all)
    compose logs --tail="${LINES}" 2>&1 | redact
    ;;
  frontend|nginx)
    compose logs --tail="${LINES}" nginx 2>&1 | redact
    ;;
  backend|app)
    compose logs --tail="${LINES}" app 2>&1 | redact
    ;;
  postgres|postgresql|db)
    compose logs --tail="${LINES}" postgres 2>&1 | redact
    ;;
  mongodb|mongo)
    echo "MongoDB is not owned by this Compose stack (GPS external)."
    echo "NOT APPLICABLE for RC1 plug-and-play package."
    ;;
  minio|object|s3)
    compose logs --tail="${LINES}" minio 2>&1 | redact
    ;;
  proxy|reverse-proxy)
    compose logs --tail="${LINES}" nginx 2>&1 | redact
    ;;
  worker)
    compose logs --tail="${LINES}" worker 2>&1 | redact
    ;;
  *)
    die "Usage: ./scripts/logs.sh [all|frontend|backend|postgres|mongodb|minio|proxy|worker] [lines]"
    ;;
esac

audit "logs service=${SVC}"
next_action "Fix issues then ./scripts/validate.sh"
exit 0
