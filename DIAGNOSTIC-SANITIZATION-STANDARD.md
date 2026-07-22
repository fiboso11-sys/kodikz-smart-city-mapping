# Diagnostic Sanitization Standard

## Tooling

- `handover/RC1-1.0.0/scripts/sanitize-diagnostics.sh`
- Shared `redact` helper in `_lib.sh` for live log tails

## Masked patterns

Passwords · DB URLs with credentials · Bearer/Basic auth · JWTs · Authorization headers · Cookie-like assignments · Private key PEM headers · Access-key shaped IDs · `*SECRET*` / `*TOKEN*` / `*KEY*` assignments

Replacement token: `[REDACTED]` (or typed markers such as `[REDACTED_JWT]`).

## Environment in bundles

Include **names + SET/MISSING + secret classification only**. Never include secret values. Never attach complete `.env.production`.

## Forbidden in bundles

Database row dumps · uploaded customer files · private keys · unrestricted full logs · session cookies
