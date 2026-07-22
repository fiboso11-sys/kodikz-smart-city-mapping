#!/usr/bin/env bash
# Sanitize diagnostic text — masks secrets. Usable as:
#   ./scripts/sanitize-diagnostics.sh file.txt
#   ./scripts/sanitize-diagnostics.sh --stdin < file.txt
#   source sanitize-diagnostics.sh && sanitize_stream < file.txt
set -euo pipefail

sanitize_stream() {
  sed -E \
    -e 's/(PASSWORD|SECRET|TOKEN|KEY|JWT|AUTHORIZATION|COOKIE|CREDENTIAL)[A-Za-z0-9_]*[[:space:]]*[=:][[:space:]]*.*/\1=[REDACTED]/Ig' \
    -e 's/(postgres(ql)?:\/\/)[^@[:space:]]+@/\1[REDACTED]@/Ig' \
    -e 's/(mongodb(\+srv)?:\/\/)[^@[:space:]]+@/\1[REDACTED]@/Ig' \
    -e 's/(mysql:\/\/)[^@[:space:]]+@/\1[REDACTED]@/Ig' \
    -e 's/(redis:\/\/)[^@[:space:]]+@/\1[REDACTED]@/Ig' \
    -e 's/Bearer[[:space:]]+[A-Za-z0-9._~\-+/=]+/Bearer [REDACTED]/Ig' \
    -e 's/Basic[[:space:]]+[A-Za-z0-9+/=]+/Basic [REDACTED]/Ig' \
    -e 's/eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/[REDACTED_JWT]/g' \
    -e 's/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/[REDACTED_PRIVATE_KEY]/g' \
    -e 's/AKIA[0-9A-Z]{16}/[REDACTED_ACCESS_KEY]/g'
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  if [[ "${1:-}" == "--stdin" ]]; then
    sanitize_stream
  elif [[ -n "${1:-}" && -f "$1" ]]; then
    sanitize_stream <"$1"
  else
    echo "Usage: $0 --stdin | $0 <file>" >&2
    exit 1
  fi
fi
