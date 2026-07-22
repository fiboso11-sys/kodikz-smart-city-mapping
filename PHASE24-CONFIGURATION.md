# Configuration

Validated by `src/lib/config/app-config.ts`.

Modes: local | pilot | municipality

Pilot and municipality refuse startup without PostgreSQL, S3-compatible storage, and real authentication.

Never place secrets in NEXT_PUBLIC_* variables.
