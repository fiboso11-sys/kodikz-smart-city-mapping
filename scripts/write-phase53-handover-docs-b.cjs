/**
 * Phase 5.3 handover docs — batch B
 */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const w = (name, body) => {
  fs.writeFileSync(path.join(root, name), body.trimStart());
  console.log("wrote", name);
};

w(
  "ENVIRONMENT-CONFIGURATION-MATRIX.md",
  `# Environment Configuration Matrix

**Authority:** Kodikz  
**Templates:** \`.env.pilot.example\` · \`.env.municipality.example\` · \`.env.local.example\`  
**Rule:** Never commit real secrets. Placeholders only.

| Variable | Owning service | Req? (pilot) | Description | Example placeholder | Secret? | Format | Default / missing impact | Responsible |
|----------|----------------|--------------|-------------|---------------------|---------|--------|--------------------------|-------------|
| DEPLOYMENT_MODE | App | Required | Mode gate | \`pilot\` | No | \`local\\|pilot\\|municipality\` | Startup ConfigError if invalid | Kodikz spec / Dubai set |
| APP_URL | App | Required | Public HTTPS URL | \`https://survey-pilot.example.ae\` | No | URL | Defaults localhost (wrong for pilot) | Dubai |
| AUTH_PROVIDER | App | Required | Auth backend | \`local\` | No | \`local\\|oidc\\|mock\` | mock forbidden in pilot | Kodikz / Dubai |
| AUTH_JWT_SECRET | App | Required | JWT signing | \`REPLACE_WITH_64_CHAR…\` | **Yes** | ≥32 chars | **Refuse start** in pilot | Dubai |
| AUTH_COOKIE_SECURE | App | Required | Secure cookies | \`true\` | No | bool | Should be true behind HTTPS | Dubai |
| MOCK_AUTH_ENABLED | App | Required | Dev bypass | \`false\` | No | bool | Must be false in pilot | Dubai |
| AUTH_SESSION_TTL | App | Optional | Access TTL sec | \`3600\` | No | int | 3600 | Kodikz |
| AUTH_REFRESH_TTL | App | Optional | Refresh TTL | \`604800\` | No | int | 7d | Kodikz |
| AUTH_LOGIN_MAX_ATTEMPTS | App | Optional | Lockout threshold | \`5\` | No | int | 5 | Kodikz |
| AUTH_LOGIN_LOCKOUT_SECONDS | App | Optional | Lockout window | \`300\` | No | int | 300 | Kodikz |
| OIDC_ISSUER | App | Req if oidc | IdP issuer | \`https://sso…/realms/giscd\` | No | URL | ConfigError if oidc | Dubai (municipality) |
| OIDC_CLIENT_ID | App | Req if oidc | Client id | \`kodikz-survey\` | No | string | ConfigError | Dubai |
| OIDC_CLIENT_SECRET | App | Req if oidc | Client secret | \`REPLACE_ME\` | **Yes** | string | ConfigError | Dubai |
| DATABASE_URL | App/Worker | Required | Postgres DSN | \`postgresql://kodikz:CHANGE_ME@postgres:5432/giscd\` | **Yes** | URI | **Refuse start** | Dubai |
| DATABASE_SSL | App | Optional | PG SSL | \`false\` | No | bool | false pilot / true muni default | Dubai |
| DATABASE_POOL_MAX | App | Optional | Pool size | \`20\` | No | int | 20 | Dubai |
| POSTGRES_USER | Compose PG | Required (compose) | Init user | \`kodikz\` | No | string | Compose fail | Dubai |
| POSTGRES_PASSWORD | Compose PG | Required | Init password | \`CHANGE_ME\` | **Yes** | string | Compose fail | Dubai |
| POSTGRES_DB | Compose PG | Required | DB name | \`giscd\` | No | string | Compose fail | Dubai |
| STORAGE_PROVIDER | App | Required | Storage mode | \`s3\` | No | \`s3\\|local\\|disabled\` | local forbidden in pilot | Dubai |
| S3_ENDPOINT | App | Required (s3) | MinIO/S3 endpoint | \`http://minio:9000\` | No | URL | Upload fail / readiness | Dubai |
| S3_REGION | App | Optional | Region | \`me-central-1\` | No | string | me-central-1 | Dubai |
| S3_BUCKET | App | Required (s3) | Bucket | \`kodikz-survey\` | No | string | ConfigError | Dubai |
| S3_ACCESS_KEY_ID | App | Required (s3) | Access key | \`CHANGE_ME\` | **Yes** | string | ConfigError | Dubai |
| S3_SECRET_ACCESS_KEY | App | Required (s3) | Secret key | \`CHANGE_ME\` | **Yes** | string | ConfigError | Dubai |
| S3_FORCE_PATH_STYLE | App | Optional | Path-style | \`true\` | No | bool | true for MinIO | Dubai |
| UPLOAD_MAX_BYTES | App | Optional | Max upload | \`8388608\` | No | int | 8MiB | Kodikz |
| REDIS_ENABLED | App | Optional | Redis flag | \`false\` | No | bool | false | Dubai |
| REDIS_URL | App | Cond. | Redis DSN | \`redis://redis:6379\` | **Yes** | URI | ConfigError if enabled w/o URL | Dubai |
| WORKER_ENABLED | Worker | Optional | Enable worker | \`true\` | No | bool | true in prod-like | Dubai |
| WORKER_POLL_MS | Worker | Optional | Poll interval | \`2000\` | No | int | 2000 | Kodikz |
| NEXT_PUBLIC_API_URL | App + Browser | Required | GPS HTTP | \`https://api-kodikz.giantphoenixllc.com\` | No | URL | GPS master fallback | Joint |
| NEXT_PUBLIC_SOCKET_URL | App + Browser | Required | GPS Socket | same as API | No | URL | No live GPS | Joint |
| GPS_API_URL | App | Optional | Server-side GPS override | — | No | URL | falls back to NEXT_PUBLIC | Kodikz |
| GEOCODING_PROVIDER | App | Optional | Geocoder | \`nominatim\` | No | enum | nominatim | Kodikz |
| GEOCODING_MIN_INTERVAL_MS | App | Optional | Rate limit geocode | \`1100\` | No | int | 1100 | Kodikz |
| LOG_LEVEL | App/Worker | Optional | Log verbosity | \`info\` | No | debug\\|info\\|warn\\|error | info pilot | Dubai |
| RATE_LIMIT_LOGIN | App | Optional | Login/min | \`10\` | No | int | 10 | Kodikz |
| RATE_LIMIT_UPLOAD | App | Optional | Upload/min | \`30\` | No | int | 30 | Kodikz |
| RATE_LIMIT_COMMAND | App | Optional | Cmd/min | \`60\` | No | int | 60 | Kodikz |
| RATE_LIMIT_MUTATION | App | Optional | Mut/min | \`120\` | No | int | 120 | Kodikz |

**MongoDB URI:** not configured in survey app — GPS backend responsibility.
`
);

// Enhance .env.pilot.example with header comment only if needed - keep placeholders
w(
  ".env.pilot.example",
  `# Kodikz Survey Platform — PILOT environment template
# Copy to .env.pilot on the Dubai Pilot VPS. NEVER commit the real file.
# Full matrix: ENVIRONMENT-CONFIGURATION-MATRIX.md
# Dubai team fills CHANGE_ME / REPLACE_* values from their secret store.

DEPLOYMENT_MODE=pilot
APP_URL=https://survey-pilot.example.ae

AUTH_PROVIDER=local
AUTH_JWT_SECRET=REPLACE_WITH_64_CHAR_RANDOM_SECRET_VALUE_HERE_XXXX
AUTH_COOKIE_SECURE=true
MOCK_AUTH_ENABLED=false

DATABASE_URL=postgresql://kodikz:CHANGE_ME@postgres:5432/giscd
DATABASE_SSL=false
DATABASE_POOL_MAX=20

STORAGE_PROVIDER=s3
S3_ENDPOINT=http://minio:9000
S3_REGION=me-central-1
S3_BUCKET=kodikz-survey
S3_ACCESS_KEY_ID=CHANGE_ME
S3_SECRET_ACCESS_KEY=CHANGE_ME
S3_FORCE_PATH_STYLE=true
UPLOAD_MAX_BYTES=8388608

REDIS_ENABLED=false
# REDIS_URL=redis://redis:6379

WORKER_ENABLED=true
WORKER_POLL_MS=2000

# External GPS backend (browser + server)
NEXT_PUBLIC_API_URL=https://api-kodikz.giantphoenixllc.com
NEXT_PUBLIC_SOCKET_URL=https://api-kodikz.giantphoenixllc.com

GEOCODING_PROVIDER=nominatim
LOG_LEVEL=info

# Used by docker-compose.pilot.yml postgres service
POSTGRES_USER=kodikz
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=giscd

RATE_LIMIT_LOGIN=10
RATE_LIMIT_UPLOAD=30
RATE_LIMIT_COMMAND=60
RATE_LIMIT_MUTATION=120
`
);

w(
  "DUBAI-SERVER-RUNTIME-VALIDATION-CHECKLIST.md",
  `# Dubai Server Runtime Validation Checklist

**Executor:** Dubai infrastructure team  
**Kodikz role:** Support / interpret failures  
**Rule:** Items below are **REQUIRES DUBAI SERVER VALIDATION** until checked on Dubai host.

## Static template review (Kodikz — this phase)

| Asset | Classification |
|-------|----------------|
| \`Dockerfile\` (Corepack pnpm@10.33.4 in runner) | **STATICALLY VERIFIED** |
| \`docker-compose.pilot.yml\` | **STATICALLY VERIFIED** |
| \`docker-compose.production-template.yml\` | **STATICALLY VERIFIED** |
| \`docker-compose.municipality-template.yml\` | **STATICALLY VERIFIED** |
| \`deploy/nginx/pilot.conf\` | **STATICALLY VERIFIED** |
| Service names app/worker/postgres/minio/nginx | **STATICALLY VERIFIED** |
| Volumes pgdata_pilot / minio_pilot | **STATICALLY VERIFIED** |
| Healthchecks (postgres, app readiness) | **STATICALLY VERIFIED** |
| Restart \`unless-stopped\` | **STATICALLY VERIFIED** |
| depends_on postgres healthy | **STATICALLY VERIFIED** |
| MinIO healthcheck absent | **STATICALLY VERIFIED** (gap — validate race on server) |
| TLS certs present on server | **REQUIRES DUBAI SERVER VALIDATION** |
| Image build / \`pnpm --version\` in container | **REQUIRES DUBAI SERVER VALIDATION** |
| Compose up healthy | **REQUIRES DUBAI SERVER VALIDATION** |

## Dubai runtime checklist

- [ ] \`docker version\` / \`docker compose version\`
- [ ] \`docker build --target runner\` and \`worker\` succeed
- [ ] \`docker run … pnpm --version\` → 10.33.4
- [ ] Copy \`.env.pilot\` (mode 600); no secrets in git
- [ ] Place TLS certs in \`deploy/certs/\`
- [ ] \`docker compose -f docker-compose.pilot.yml up -d --build\`
- [ ] \`docker compose ps\` all healthy/running
- [ ] \`curl -k https://<host>/readiness\` → ready
- [ ] \`curl -k https://<host>/health\` → ok
- [ ] Logs: no crash loop (\`docker compose logs -f app worker\`)
- [ ] Postgres not published publicly
- [ ] MinIO not published publicly
`
);

w(
  "DUBAI-INFRASTRUCTURE-REQUIREMENTS.md",
  `# Dubai Infrastructure Requirements

**Audience:** Dubai infrastructure team  
**Author:** Kodikz (requirements only — **Kodikz does not configure the server**)

## Compute / storage

| Spec | Minimum | Preferred |
|------|---------|-----------|
| OS | Ubuntu **22.04 or 24.04** LTS | 24.04 LTS |
| vCPU | 4 | 8 |
| RAM | 8 GB | 16 GB |
| Disk | 150 GB SSD | 250 GB+ |
| Swap | Recommended ≥2 GB | — |

## Docker

| Component | Requirement |
|-----------|-------------|
| Docker Engine | 24+ (current stable) |
| Docker Compose | Plugin v2 (\`docker compose\`) |
| Runtime | Linux containers |

## Network

| Direction | Ports / access |
|-----------|----------------|
| Inbound | **22** (SSH admin) · **80** · **443** |
| Inbound forbidden | **5432**, **9000**, **9001**, app **3000** publicly |
| Outbound | GPS API/Socket HTTPS · OSM/Carto tiles · MapLibre glyphs · (optional) Nominatim |
| DNS | A/AAAA for pilot hostname → VPS |
| TLS | Valid cert for APP_URL (fullchain + privkey for Nginx template) |

## Persistence

| Volume | Purpose |
|--------|---------|
| Postgres data | Assignments, audit, sessions |
| MinIO data | Photos / attachments |
| Backup disk | Logical dumps + optional snapshots |

## Ops expectations

| Topic | Expectation |
|-------|-------------|
| Timezone | \`Asia/Dubai\` or UTC (document choice) |
| NTP | chrony/systemd-timesyncd |
| Log retention | ≥14 days app/nginx; ship to Dubai SIEM if required |
| Backups | Daily \`pg_dump\` + pre-migrate dumps; MinIO backup per Dubai |
| SMTP | Not required by core survey app |
| Monitoring | Dubai-owned host monitoring; app exposes \`/api/health\` + \`/api/readiness\` |

## Out of Dubai Compose scope

GPS backend + MongoDB remain on existing GPS infrastructure unless Dubai relocates them.
`
);

w(
  "API-INTEGRATION-HANDOVER.md",
  `# API & Integration Handover

**Owner:** Kodikz — documentation of **existing** contracts (no contract changes in this phase)

## Base

| Item | Value |
|------|--------|
| Base URL | \`https://<APP_HOST>\` (Nginx → app:3000) |
| Survey API prefix | \`/api/*\` |
| Auth header | \`Authorization: Bearer <accessToken>\` or cookie \`kodikz_access\` |
| Request id | \`x-request-id\` (echoed on responses) |

## Auth flow

1. \`POST /api/auth/login\` \`{ email, password, tenantId? }\`  
2. Response: \`accessToken\`, \`refreshToken\`, \`user\`, sets HttpOnly cookie  
3. Subsequent APIs: Bearer or cookie  
4. \`POST /api/auth/logout\`

Error shape: \`{ code, message, requestId, details?, validationErrors? }\`

## Roles

SUPER_ADMIN · TENANT_ADMIN · SUPERVISOR · DRIVER · VIEWER — see \`src/lib/auth/permissions.ts\`

## Main endpoint groups

| Area | Paths |
|------|--------|
| Health | \`GET /api/health\`, \`/api/readiness\`, \`/api/system-health\`, \`/api/gps/health\` |
| Vehicles | \`/api/vehicles\`, \`/api/vehicles/live\`, \`/api/vehicles/[id]\` |
| Permits / geo | \`/api/permits\`, \`/api/geo-uploads\`, permit upload routes |
| Assignments | \`/api/survey-assignments\` + \`/[id]\` + start/pause/resume/complete/cancel |
| Survey data | decisions, progress, alerts, commands, timeline, history, audit, notifications, photos, blockages, attachments |
| Realtime survey | \`GET /api/survey-events\` (**SSE**) |

## GPS / Mongo / Socket.IO

| Concern | Owner | Detail |
|---------|-------|--------|
| Live GPS positions | GPS backend | Browser Socket.IO to \`NEXT_PUBLIC_SOCKET_URL\` |
| MongoDB | GPS backend | Survey app does **not** connect |
| Survey collaboration events | Survey app | SSE event names (compat names from Phase 23): \`survey_assignment_*\`, \`survey_started/paused/resumed/completed\`, \`survey_decision_updated\`, \`survey_alert_*\`, \`blockage_reported\`, \`supervisor_command\`, \`driver_message\`, \`survey_photo_uploaded\`, \`survey_notification\` |

## Status codes (typical)

200 OK · 400 validation · 401 unauthorized · 403 forbidden · 404 not found · 409 conflict · 429 rate limit · 503 not ready

## Proxy requirements (Dubai Nginx)

- HTTP→HTTPS redirect  
- \`Upgrade\` / \`Connection\` for Socket.IO **if** proxied through same host  
- SSE: \`proxy_buffering off\` for \`/api/survey-events\`  
- \`client_max_body_size\` ≥ upload limit (template 12m)  

## CORS

Same-origin via Nginx is preferred. If split origins, Dubai must allow APP origin to API — **confirm with Kodikz before changing**.
`
);

console.log("batch B done");
