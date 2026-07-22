# Phase 2.2 — Alert Center

**UI:** `AlertCenterPanel` on Command Center  
**Engine:** `src/platform/sge/alerts/alert-center.ts`

---

## Severity
INFO · WARNING · CRITICAL  
(Mapped operationally as Low / Medium–High / Critical)

## Categories
ROUTE_DEVIATION · WRONG_DIRECTION · GPS_QUALITY · BLOCKAGE · COMPLETION · SYSTEM

## Actions
- Acknowledge
- Dismiss
- Export CSV

## Filters (API)
vehicleId · severity · assignmentId · status · category

## Sources
- Automatic from Event Bus (deviation, GPS, blockage, completion)
- Driver: Need Supervisor / Emergency
- Supervisor: Send Message / Request Return / Approve Diversion
