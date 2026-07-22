# Environment Configuration Matrix

**Authority:** Kodikz  
**Templates:** `.env.pilot.example` · `.env.municipality.example` · `.env.local.example`  
**Rule:** Never commit real secrets. Placeholders only.

| Variable | Owning service | Req? (pilot) | Description | Example placeholder | Secret? | Format | Default / missing impact | Responsible |
|----------|----------------|--------------|-------------|---------------------|---------|--------|--------------------------|-------------|
| DEPLOYMENT_MODE | App | Required | Mode gate | `pilot` | No | `local\|pilot\|municipality` | Startup ConfigError if invalid | Kodikz spec / Dubai set |
| APP_URL | App | Required | Public HTTPS URL | `https://survey-pilot.example.ae` | No | URL | Defaults localhost (wrong for pilot) | Dubai |
| AUTH_PROVIDER | App | Required | Auth backend | `local` | No | `local\|oidc\|mock` | mock forbidden in pilot | Kodikz / Dubai |
| AUTH_JWT_SECRET | App | Required | JWT signing | `REPLACE_WITH_64_CHAR…` | **Yes** | ≥32 chars | **Refuse start** in pilot | Dubai |
| AUTH_COOKIE_SECURE | App | Required | Secure cookies | `true` | No | bool | Should be true behind HTTPS | Dubai |
| MOCK_AUTH_ENABLED | App | Required | Dev bypass | `false` | No | bool | Must be false in pilot | Dubai |
| AUTH_SESSION_TTL | App | Optional | Access TTL sec | `3600` | No | int | 3600 | Kodikz |
| AUTH_REFRESH_TTL | App | Optional | Refresh TTL | `604800` | No | int | 7d | Kodikz |
| AUTH_LOGIN_MAX_ATTEMPTS | App | Optional | Lockout threshold | `5` | No | int | 5 | Kodikz |
| AUTH_LOGIN_LOCKOUT_SECONDS | App | Optional | Lockout window | `300` | No | int | 300 | Kodikz |
| OIDC_ISSUER | App | Req if oidc | IdP issuer | `https://sso…/realms/giscd` | No | URL | ConfigError if oidc | Dubai (municipality) |
| OIDC_CLIENT_ID | App | Req if oidc | Client id | `kodikz-survey` | No | string | ConfigError | Dubai |
| OIDC_CLIENT_SECRET | App | Req if oidc | Client secret | `REPLACE_ME` | **Yes** | string | ConfigError | Dubai |
| DATABASE_URL | App/Worker | Required | Postgres DSN | `postgresql://kodikz:CHANGE_ME@postgres:5432/giscd` | **Yes** | URI | **Refuse start** | Dubai |
| DATABASE_SSL | App | Optional | PG SSL | `false` | No | bool | false pilot / true muni default | Dubai |
| DATABASE_POOL_MAX | App | Optional | Pool size | `20` | No | int | 20 | Dubai |
| POSTGRES_USER | Compose PG | Required (compose) | Init user | `kodikz` | No | string | Compose fail | Dubai |
| POSTGRES_PASSWORD | Compose PG | Required | Init password | `CHANGE_ME` | **Yes** | string | Compose fail | Dubai |
| POSTGRES_DB | Compose PG | Required | DB name | `giscd` | No | string | Compose fail | Dubai |
| STORAGE_PROVIDER | App | Required | Storage mode | `s3` | No | `s3\|local\|disabled` | local forbidden in pilot | Dubai |
| S3_ENDPOINT | App | Required (s3) | MinIO/S3 endpoint | `http://minio:9000` | No | URL | Upload fail / readiness | Dubai |
| S3_REGION | App | Optional | Region | `me-central-1` | No | string | me-central-1 | Dubai |
| S3_BUCKET | App | Required (s3) | Bucket | `kodikz-survey` | No | string | ConfigError | Dubai |
| S3_ACCESS_KEY_ID | App | Required (s3) | Access key | `CHANGE_ME` | **Yes** | string | ConfigError | Dubai |
| S3_SECRET_ACCESS_KEY | App | Required (s3) | Secret key | `CHANGE_ME` | **Yes** | string | ConfigError | Dubai |
| S3_FORCE_PATH_STYLE | App | Optional | Path-style | `true` | No | bool | true for MinIO | Dubai |
| UPLOAD_MAX_BYTES | App | Optional | Max upload | `8388608` | No | int | 8MiB | Kodikz |
| REDIS_ENABLED | App | Optional | Redis flag | `false` | No | bool | false | Dubai |
| REDIS_URL | App | Cond. | Redis DSN | `redis://redis:6379` | **Yes** | URI | ConfigError if enabled w/o URL | Dubai |
| WORKER_ENABLED | Worker | Optional | Enable worker | `true` | No | bool | true in prod-like | Dubai |
| WORKER_POLL_MS | Worker | Optional | Poll interval | `2000` | No | int | 2000 | Kodikz |
| NEXT_PUBLIC_API_URL | App + Browser | Required | GPS HTTP | `https://api-kodikz.giantphoenixllc.com` | No | URL | GPS master fallback | Joint |
| NEXT_PUBLIC_SOCKET_URL | App + Browser | Required | GPS Socket | same as API | No | URL | No live GPS | Joint |
| GPS_API_URL | App | Optional | Server-side GPS override | — | No | URL | falls back to NEXT_PUBLIC | Kodikz |
| GEOCODING_PROVIDER | App | Optional | Geocoder | `nominatim` | No | enum | nominatim | Kodikz |
| GEOCODING_MIN_INTERVAL_MS | App | Optional | Rate limit geocode | `1100` | No | int | 1100 | Kodikz |
| LOG_LEVEL | App/Worker | Optional | Log verbosity | `info` | No | debug\|info\|warn\|error | info pilot | Dubai |
| RATE_LIMIT_LOGIN | App | Optional | Login/min | `10` | No | int | 10 | Kodikz |
| RATE_LIMIT_UPLOAD | App | Optional | Upload/min | `30` | No | int | 30 | Kodikz |
| RATE_LIMIT_COMMAND | App | Optional | Cmd/min | `60` | No | int | 60 | Kodikz |
| RATE_LIMIT_MUTATION | App | Optional | Mut/min | `120` | No | int | 120 | Kodikz |

**MongoDB URI:** not configured in survey app — GPS backend responsibility.
