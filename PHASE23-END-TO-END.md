# Phase 2.3 — End-to-End Validation

## Automated

```bash
npx tsx src/services/survey/__tests__/phase23-e2e.ts
```

Workflow covered:

1. Create → Approve → Start assignment  
2. Persist OFF_ROUTE / WRONG_DIRECTION decision → notifications  
3. Return ON_ROUTE → audit  
4. Blockage + photo metadata  
5. Supervisor PAUSE / RESUME / SEND_MESSAGE  
6. Complete → restore via get/list  
7. EN/AR localization resources  
8. Event hub history  

## Manual field checklist

- [ ] Assign route from Dashboard / Copilot  
- [ ] Driver sees survey on Copilot after refresh  
- [ ] GPS ticks update progress  
- [ ] Wrong direction triggers voice + supervisor alert  
- [ ] Driver returns → state recovers  
- [ ] Blockage with camera photo uploads  
- [ ] Supervisor pause/resume/cancel propagates without refresh  
- [ ] Offline: queue fills, reconnect flushes  
- [ ] `?pilot=1` diagnostics visible  
- [ ] Phase 1 live map / vehicles / permits unchanged  

## Quality gate

```bash
pnpm install
pnpm lint
pnpm type-check
pnpm build
pnpm dev
```
