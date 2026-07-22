# Realtime Architecture

GPS Socket.IO remains on the existing backend.

Survey sync uses an SSE adapter behind a transport abstraction so Socket.IO survey can be added later without changing UI stores.

Normalized event fields: eventId, eventType, tenantId, assignmentId, vehicleId, timestamp, revision, payload.

Critical events are written to the outbox, then published by the worker.
