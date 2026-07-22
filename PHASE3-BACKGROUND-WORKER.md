# Phase 3 — Background Worker

`pnpm worker` → `scripts/worker.ts`

Processes transactional outbox (`event_outbox` / in-memory local).
Retries failed publishes; does not require an open browser.
