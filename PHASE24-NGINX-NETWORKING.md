# Nginx Networking

Config: `deploy/nginx/pilot.conf`

Routes: frontend, /api/*, SSE (/api/survey-events with buffering off), attachments, optional /socket.io/, /health, /readiness.

Do not expose PostgreSQL, Redis, or MinIO admin publicly.
