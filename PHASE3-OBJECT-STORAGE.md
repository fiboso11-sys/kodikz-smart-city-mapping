# Phase 3 — Object Storage

Abstraction: `src/lib/storage/object-storage.ts`
Providers: local (dev), S3/MinIO, disabled

API: `/api/attachments` (authenticated)
Legacy: `/api/survey-photos` re-exports attachments handlers

Validation: size, MIME, magic bytes, safe filename, tenant-scoped keys
