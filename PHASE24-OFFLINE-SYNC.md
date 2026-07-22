# Offline Sync

Client offline queue persists assignments, decisions, blockages, and progress with coalescing and retries.

Server is authoritative for supervisor lifecycle actions.
Driver blockages should merge idempotently (PostgreSQL unique client_operation_id).
