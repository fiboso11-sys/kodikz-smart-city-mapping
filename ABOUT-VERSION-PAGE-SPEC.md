# About / Version Page Spec

## Location

Settings → **About / Version** (`/settings/about`)  
Mobile shell includes the same link. No new top-level sidebar item (no nav redesign).

## Fields

Product name · Version · Release channel · Git tag · Commit SHA · Build date · Database migration version · Runtime environment · Image name · Deployment ID · Copyright · Support contact · Documentation reference

## Rules

- Simple `command-panel` layout consistent with RC1 Settings
- No marketing copy
- No infrastructure secrets
- Points operators to `./scripts/support.sh` for sanitized host diagnostics

## Data source

`GET /api/release-identity` → `src/lib/release-identity.ts`
