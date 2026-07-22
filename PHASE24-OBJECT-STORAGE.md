# Object Storage

Abstraction supports upload, download, delete, exists, signedUrl, health.

Providers: local (dev only), S3/MinIO (pilot), municipality S3.

Validation covers size, MIME, magic bytes, and safe filenames.
Binaries never stored in PostgreSQL or SQLite.

API: `/api/attachments`
