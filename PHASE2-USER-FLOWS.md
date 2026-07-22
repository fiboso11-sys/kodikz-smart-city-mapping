# Phase 2.2 — User Flows

**Date:** 2026-07-16

---

## Driver Flow
1. Open `/survey-copilot`
2. Select vehicle → assign route → Start Survey
3. Drive with large status + voice guidance
4. Pause / Resume as needed
5. Report blockage if blocked
6. Need Supervisor / Emergency if required
7. Finish Survey when complete

## Supervisor Flow
1. Open `/survey-guidance` Command Center
2. Scan KPI strip for Off Route / GPS Lost / Blockages
3. Select vehicle in table or map
4. Inspect timeline + decision history
5. Pause / Resume / Cancel / Request Return / Approve Diversion
6. Acknowledge alerts · Send message

## Shared Truth
```
GPS → SGE → Decision Bus → UI (Copilot / Command Center)
                 ↓
              Event Bus → Voice / Alerts / Timeline
```

No UI recalculates corridor, heading, or completion.
