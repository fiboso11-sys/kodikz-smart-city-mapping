# Pilot Handover Acceptance Checklist

Mark each row: Pass / Fail / N/A · Owner completes evidence.

| Check | Owner |
|-------|-------|
| Frontend loads over HTTPS | **Joint** |
| Authentication works (login/logout) | **Joint** |
| Role access works (supervisor vs driver) | **Kodikz** (validate) / **Joint** |
| `/api/health` passes | **Dubai** |
| `/api/readiness` passes | **Dubai** |
| PostgreSQL connection passes | **Dubai** |
| GPS backend connection passes | **Joint** |
| Socket.IO connects | **Joint** |
| Vehicle data received | **Joint** |
| Map loads (basemap + marker) | **Joint** |
| Assignments work | **Kodikz** / **Joint** |
| Survey session starts | **Joint** |
| Pause/resume persists after refresh | **Joint** |
| Driver Copilot works | **Joint** |
| Command Center updates | **Joint** |
| Arabic and English work | **Joint** |
| File/photo upload works | **Joint** |
| Logs available (`docker compose logs`) | **Dubai** |
| Backup command works | **Dubai** |
| Restart preserves persistent data | **Dubai** |
| HTTPS works | **Dubai** |
| WebSocket / SSE proxy works | **Dubai** / **Joint** |

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| Kodikz | | | |
| Dubai Infrastructure | | | |
| Pilot Product Owner | | | |
