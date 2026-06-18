#!/usr/bin/env bash
# Health probe for monitoring (cron / Uptime Kuma)
# Usage: ./scripts/healthcheck.sh [URL]

set -euo pipefail

URL="${1:-http://127.0.0.1:3000/health}"
RESP="$(curl -fsS --max-time 5 "$URL")"
STATUS="$(echo "$RESP" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)"

if [ "$STATUS" != "ok" ]; then
  echo "UNHEALTHY: $RESP" >&2
  exit 1
fi

echo "OK: $RESP"
