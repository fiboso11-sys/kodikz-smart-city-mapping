# Phase 4.2F — RC1 Readiness Review

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Branch:** `phase2/dubai-giscd-enhancements`  
**Date:** 2026-07-22  
**Review type:** Independent Release Readiness Review (audit only)  
**Constraints:** No features · No refactor · No UI/API/DB/Auth/RBAC/SGE changes · No commit · No push · No deploy · No tags · No Phase 5  

---

## 1. Executive Summary

Phase 4.2F reassessed residual RC1 items against evidence from Phase 4.2E and a fresh latency probe. **No confirmed application defect** blocks an **internal** RC1 pilot. The four soak timeouts are explained by probe/environment conditions (host suspend gaps, Next.js local unresponsiveness after idle, aggressive 8s health client timeout) and **self-recover**. Incomplete device lab and OS sleep/wake are **pilot acceptance** items, not engineering blockers.

| Field | Value |
|-------|--------|
| **Current RC1 Score** | **91 / 100** (unchanged — no new defect; no new closed lab gap) |
| **FINAL DECISION** | **1. RC1 READY FOR INTERNAL PILOT** |
| Customer production rollout | **NO** |
| Freeze frontend for RC1 | **YES** (pending explicit approval) |

---

## 2. Current RC1 Score

**91 / 100** — retained from Phase 4.2E.

- Not increased: full device lab and OS sleep/wake remain incomplete.  
- Not decreased: soak re-analysis attributes timeouts to environment/probe, not a new app defect.

---

## 3. Verified Strengths

| Area | Status | Basis |
|------|--------|--------|
| Build / type-check / lint | PASS | 4.2E regression |
| UAT (24) / failure-matrix automation (5) | PASS | 4.2E |
| API / RBAC | PASS | Prior phases |
| Survey Guidance / Driver Copilot / Route Assignment | PASS | Browser + UAT |
| Vehicle marker / basemap / map height / GPS | PASS | 4.2B–4.2E |
| Pause restore after refresh | PASS | Copilot + Command Center evidence |
| Manual browser offline / GPS block / multi-tab | PASS | 4.2E CDP |
| Arabic foundation | PASS | Prior |
| Hydration + MapLibre glyphs Issues | CLOSED | 4.2E fixes |

---

## 4. Soak Investigation

### 4.1 Method under review

PowerShell loop (21 iterations, `Start-Sleep 60`):

- `GET /api/health` — **TimeoutSec 8**  
- `GET /api/vehicles/live` — **TimeoutSec 15**  
- Log: `PHASE42E-SOAK-TIMESTAMPS.txt`  
- Wall clock: started `2026-07-22T08:26:11Z`, ended `11:10:25Z` (~**2.7 hours** for a nominal ~21-minute soak)

### 4.2 Timeline evidence

| Timestamp | Result | Notes |
|-----------|--------|--------|
| 13:57:19 | **FAIL** timeout | First sample |
| 13:58:28 → 14:02:32 | health=200 live=1 source=gps | ~61s cadence — healthy |
| **14:02 → 15:33** | **~91 min gap** | Exceeds 60s sleep → host suspend / process stall |
| 15:33:56 | **FAIL** timeout | First sample after long gap |
| 15:35:04 → 15:46:23 | health=200 live=1 | Recovered; stable block |
| **15:46 → 16:39** | **~53 min gap** | Again exceeds probe interval |
| 16:39:05, 16:40:14 | **FAIL** ×2 | After long gap |
| — | SOAK20_DONE | Completed |

**Successful samples:** 17  
**Timeouts:** 4  
**Recovery:** next successful sample within ~1–1.5 minutes when the host was responsive

### 4.3 Fresh latency probe (2026-07-22, same machine)

| Sample | Result |
|--------|--------|
| 1–3 | FAIL ~15s (health client timeout) |
| 4 | health **5951 ms**, live **1115 ms**, source=gps |
| 5–10 | health **222–621 ms**, live **449–1705 ms**, source=gps |

Aggregates (successful samples only):

| Endpoint | Avg | Max | Min |
|----------|-----|-----|-----|
| `/api/health` | ~1189 ms | 5951 ms | 222 ms |
| `/api/vehicles/live` | ~850 ms | 1705 ms | 449 ms |

External GPS (direct):

| Call | Result |
|------|--------|
| `api-kodikz…/health` | 200 in **1454 ms** |
| `api-kodikz…/vehicles` | 200 in **386 ms** |

### 4.4 What generated the four timeouts?

| Hypothesis | Verdict | Evidence |
|------------|---------|----------|
| Application business-logic defect | **Not supported** | After timeout, same endpoints return 200 with `source=gps`, live=1; no crash loop in app logs from this pattern |
| Browser / MapLibre / Socket.IO | **Not primary** | Soak was **PowerShell HTTP**, not browser |
| GPS backend outage | **Unlikely as sole cause** | Direct GPS healthy; live returns `source=gps` on recovery; live route falls back to `master` on GPS failure (would still 200, not client timeout) |
| Polling storm | **Not evidenced** | Soak is 1 pair/min |
| **Local Next.js unresponsive / cold after idle** | **Supported** | Fresh probe: 3× health timeout, then health 5.9s, then sub-second; port 3000 accepted connections while first health calls hung |
| **Host sleep / long wall-clock gaps** | **Supported** | 91 min and 53 min gaps between samples vs 60s sleep |
| **Probe client timeout too tight** | **Supported** | Health **TimeoutSec 8**; cold health observed at **5951 ms** (would fail 8s gate even when server eventually answers) |
| Concurrent build / browser load during 4.2E | **Contributing possible** | Builds and page matrices ran during soak window |

### 4.5 Metrics summary

| Metric | Value |
|--------|--------|
| Average response (healthy window, soak cadence) | ~1s combined (health+live typical when OK) |
| Maximum observed (fresh probe) | health **5951 ms**; live **1705 ms** |
| Recovery time after FAIL | **~1–1.5 min** to next 200 |
| User-visible impact | Transient: UI already shows RECONNECTING / GPS DISCONNECTED / master fallback; **self-heals** when Next + GPS respond |

### 4.6 Soak conclusion

**The four timeouts are harmless for internal RC1 when classified as environmental / probe / local-dev cold-path events that self-recover.**  
They are **not** treated as a confirmed application defect requiring a code change in this audit.

**Mitigation for Pilot Validation (ops, not code):** monitor `/api/health` and `/api/vehicles/live` SLOs; use production Node runtime (not long-lived overloaded `next dev`); avoid 8s health probes if cold starts >8s are expected.

---

## 5. Residual Risks — Classification

| Item | Class | Business | Pilot | Production | Likelihood | Severity | Mitigation | Move to Pilot Validation? |
|------|-------|----------|-------|------------|------------|----------|------------|---------------------------|
| Soak 4× timeouts | **Low** | Brief stale GPS/health in monitoring scripts | Occasional probe fail; UI degrades gracefully | Needs prod SLO monitoring | Medium (local/idle) | Low | Longer probe timeout; prod process manager; alert on sustained fail | **Yes** (observe in pilot) |
| OS Sleep / Wake unverified | **Low** | Driver laptop lid close | Possible reconnect after wake | Same | Medium in field | Low | Pilot script: sleep 5–10 min, wake, confirm PAUSED/GPS | **Yes** |
| Incomplete responsive device lab | **Low** | Some phone/landscape layouts untested | Field devices may find layout nits | Higher bar for municipality rollout | Medium | Low–Medium if clipping found | PAT on Android + landscape; fix only verified bugs | **Yes** |
| Survey API hard-down not forced | **Negligible–Low** | Offline paths partially proven | Low | Need chaos test later | Low | Medium if unhandled | PAT / Phase 5 chaos | **Yes** (optional) |
| Glyphs CDN dependency | **Low** | Cluster count labels need font glyphs | Labels may miss if CDN blocked | Same | Low | Low | Document network allowlist | **Yes** (doc) |
| Arabic flash until post-hydrate sync | **Negligible** | Brief LTR flash if locale=ar | Cosmetic | Cosmetic | Low | Negligible | Accept or later SSR locale | Future |

**No residual item is classified Critical or High for internal pilot.**

---

## 6. Responsive Risk

| Question | Answer |
|----------|--------|
| Is incomplete device coverage a **release blocker** for internal RC1? | **No** |
| Classification | **Pilot limitation** + **documentation / PAT item** |
| Why not exaggerate? | Desktop, iPad Live, and iPhone Copilot were exercised with usable primary controls and map height; no verified clipping defect remains open |

**Not** a future enhancement only — it **should** be completed in Pilot Acceptance Testing before customer production.

---

## 7. Manual Coverage Review

| Test | Status | Before Internal Pilot | Before Customer Production |
|------|--------|------------------------|----------------------------|
| Internet OFF / ON | Completed (4.2E) | Not required again | Re-run in PAT |
| GPS OFF / ON | Completed (4.2E CDP block) | Not required again | Re-run in PAT |
| Browser refresh restore | Completed | Not required | Re-run |
| Multi-tab PAUSED sync | Completed | Not required | Re-run |
| Offline queue (automated) | Completed | Not required | Expand browser flush in PAT |
| Reconnect after offline | Completed | Not required | Re-run |
| OS Sleep / Wake | **Not Required Before Pilot** / **Required Before Production** (PAT) | Can ship internal pilot | **Required** in PAT |
| Android device lab | Partially (emulated widths only) | Not Required Before Pilot | **Required Before Production** |
| Landscape | Not completed | Not Required Before Pilot | **Required Before Production** |
| Physical tablet | Partial (iPad metrics) | Not Required Before Pilot | **Required Before Production** |

---

## 8. Stability Review

| Subsystem | Evidence of instability? | Verdict |
|-----------|--------------------------|---------|
| Memory | Spot heap ~59–91 MB; no monotonic growth proven | **Stable enough for pilot** |
| CPU | No sustained spike evidence | **OK** |
| Realtime / GPS | live=1 source=gps when healthy; disconnect/reconnect paths work | **OK** |
| Assignment / Pause / Resume / Restore | Verified PAUSED round-trip | **OK** |
| Survey Guidance / Copilot / Command Center | Interactive, consistent PAUSED | **OK** |
| Map | Basemap + Pilot marker; glyphs fix removed console storm | **OK** |
| Timeline | Restore event present | **OK** |
| Recovery | Offline + GPS block self-heal | **OK** |

**No evidence suggests systemic instability that would block internal pilot.**

---

## 9. Decision Matrix

| Remaining item | Evidence | Risk | Recommendation | Owner | Target Phase |
|----------------|----------|------|----------------|-------|--------------|
| Soak 4× timeouts | Gaps + 8s health timeout + cold health 5.9s; self-recover | Low | Accept for internal RC1; monitor in pilot | Ops / QA | Pilot Validation |
| OS Sleep / Wake | Not executed | Low | Pilot Validation checklist | QA | Pilot |
| Android lab | Emulation only | Low | PAT on real devices | QA / FE | Pilot → Pre-Prod |
| Landscape | Not done | Low | PAT | QA | Pilot → Pre-Prod |
| Full page × viewport matrix | Partial | Low | PAT checklist | QA | Pilot |
| Survey API hard-down | Not forced | Negligible–Low | Optional chaos in PAT | QA / Backend | Pilot / Phase 5 |
| Customer production | Gaps above | High if skipped | Hold until PAT complete | Release Manager | Post-Pilot |

---

## 10. GO / NO-GO Answers

| Question | Answer |
|----------|--------|
| Is there any **confirmed application defect** preventing RC1? | **NO** |
| Would you allow an **INTERNAL pilot**? | **YES** |
| Would you allow a **CUSTOMER production rollout**? | **NO** |
| Would you **freeze frontend** development? | **YES** (RC1 freeze; bugfix only) |
| Should remaining manual coverage move into **Pilot Acceptance Testing**? | **YES** |

---

## 11. Known Limitations (document for pilot)

1. Long-lived `next dev` can become temporarily unresponsive after host sleep / heavy load; first health probes may exceed 8s.  
2. Cluster label glyphs depend on MapLibre demotiles font CDN.  
3. Arabic `dir` applied after hydration (brief flash possible).  
4. Full physical Android / landscape matrix not signed off.  
5. OS lid-sleep recovery not signed off.

---

## 12. Pilot Readiness vs Production Readiness

| | Internal Pilot | Customer Production |
|--|----------------|---------------------|
| Ready? | **YES** | **NO** |
| Conditions | Freeze FE; track soak/GPS SLOs; PAT backlog for sleep/wake + devices | Complete PAT; clean soak on pilot hardware; chaos tests; ops runbooks |

---

## 13. Risk Matrix (summary)

```
Critical:  (none)
High:      Customer prod without PAT  → HOLD
Medium:    (none open for internal pilot)
Low:       Soak timeouts, sleep/wake, responsive lab gaps, glyphs CDN
Negligible: Arabic flash, optional API hard-down
```

---

## 14. Evidence Summary

| Source | Use |
|--------|-----|
| `PHASE42E-SOAK-TIMESTAMPS.txt` | 17 OK / 4 FAIL; wall-clock gaps |
| Terminal `973074` soak metadata | ~2.7h wall time; TimeoutSec 8/15 |
| Fresh latency probe `973082` | 3 cold fails → recover; health max 5951 ms |
| Direct GPS probe | Backend healthy (386–1454 ms) |
| `PHASE42E-RC1-BLOCKER-CLOSURE.md` | Closed blockers; score 91 |
| Browser evidence (4.2E) | Pause restore, offline/GPS, responsive samples |

---

## 15. Recommended Next Phase

**Do not start Phase 5 (Infrastructure & Pilot Deployment Readiness) until Product/Release explicitly approves RC1 freeze.**

Recommended sequence after approval:

1. **Frontend RC1 freeze** (bugfix only)  
2. **Internal Pilot + Pilot Acceptance Testing** (sleep/wake, Android, landscape, soak on pilot host)  
3. Then **Phase 5** infrastructure / municipality deployment readiness  

---

## 16. FINAL DECISION

# **1. RC1 READY FOR INTERNAL PILOT**

**Why:**  
All confirmed application blockers from 4.2E are closed. Residual items are **Low / Negligible** coverage and environment risks that self-recover or belong in Pilot Acceptance Testing. Score remains **91**. Internal pilot is justified; customer production is not.

**Why not “NOT READY”:**  
No verified application defect remains that prevents an internal pilot. Incomplete lab coverage is not treated as an invented blocker.

---

## STOP

- No commit · No push · No merge · No deploy · No tags · No Phase 5  
- Awaiting explicit approval to freeze frontend and proceed to internal pilot / PAT  

*End of Phase 4.2F RC1 Readiness Review.*
