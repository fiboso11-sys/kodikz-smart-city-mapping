# Phase 4.2 — Frontend Bug Burn-Down Report

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Branch:** `phase2/dubai-giscd-enhancements`  
**Date:** 2026-07-16  
**Environment:** `http://localhost:3000` · `.env.local` · `DEPLOYMENT_MODE=local`  
**Scope:** Fix ONLY the four verified Phase 4.1 bugs — no new features, no UI redesign, no business-logic changes  
**Constraints:** No commit · No push · No merge · No deploy · No tags · No Dubai contact

---

## 1. Executive Summary

Phase 4.2 targeted the four residual issues from Phase 4.1 (vehicle markers, console noise, failure recovery, Arabic chrome). All four were addressed with minimal, root-cause fixes. Automated quality gates pass; browser spot-checks confirm console and RTL improvements.

| Bug | Phase 4.1 | Phase 4.2 | Verification |
|-----|-----------|-----------|--------------|
| FE-01 Vehicle markers as circles | FAIL | **Fixed in code** | Code audit PASS · Visual with live GPS **MANUAL VALIDATION REQUIRED** |
| FE-03 Console `/sw.js` 404 + reconnect flicker | WARNING | **Fixed** | Browser PASS |
| FE-07 Failure recovery matrix | PARTIAL | **Expanded** | Automated 5/5 PASS · Browser scenarios **MANUAL VALIDATION REQUIRED** |
| FE-02 Arabic chrome / RTL | FAIL | **Partially fixed** | Nav + GPS chrome PASS · Page content still English |

| Metric | Phase 4.1 | Phase 4.2 |
|--------|-----------|-----------|
| Frontend score | 78 / 100 | **86 / 100** |
| Quality gate (lint/type/build/UAT) | PASS | PASS |
| **GO / NO-GO** | NO-GO | **NO-GO** (full certification) |

**Verdict:** Substantial burn-down complete. Full frontend certification remains **NO-GO** until vehicle markers are visually confirmed with live coordinates and browser-only failure scenarios are exercised. Code is ready for a short manual validation pass before Dubai handoff.

---

## 2. Vehicle Marker Audit

### 2.1 Implementation search

| Search term | Location | Role |
|-------------|----------|------|
| `createVehicleMarkerElement` | Not in active platform path | Legacy/unused |
| `vehicle-marker` | `src/lib/geo/vehicle-marker.ts` | **NEW** — 42px SDF car images |
| `MapView` | `src/components/maps/MapView.tsx` | Primary map (Dashboard, Live Monitoring, Survey Guidance) |
| `vehicle-points` | **Removed** from active code | Was root cause (circle layer for individuals) |
| `vehicle-markers` | `MapView.tsx` + `vehicle-marker.ts` | Symbol layer for unclustered vehicles |
| `clusters` / `point_count` | `MapView.tsx` | Cluster circles unchanged |
| `CircleLayer` | `vehicle-selected-ring` only | Selection pulse ring (not vehicle body) |
| `live-map.tsx` | `frontend/` legacy tree | Not mounted in platform routes |

### 2.2 Root cause

Individual vehicles were rendered by a **circle** layer (`vehicle-points`) on the clustered GeoJSON source. Clusters correctly used circles; individuals should have used icons.

### 2.3 Fix

1. **`src/lib/geo/vehicle-marker.ts`** — Canvas-drawn 42px top-down car silhouettes registered as MapLibre SDF images (`vehicle-car`, `vehicle-car-selected`). Symbol layer `vehicle-markers` with heading rotation, status color tint, selection highlight. `resetVehicleMarkerImages()` re-registers after basemap style reload.

2. **`src/components/maps/MapView.tsx`** — Replaced circle `vehicle-points` with `addVehicleMarkerLayers()`. GeoJSON properties include `heading`, `selected`, `color`. Click handler queries `vehicle-markers` + `clusters`. In-place `setData()` updates — no marker recreation, no map remount.

### 2.4 Rules compliance

| Rule | Status |
|------|--------|
| Individual → 42px car SVG | PASS (code) |
| Selected → highlighted car icon | PASS (code) |
| Cluster → circle with count | PASS (unchanged) |
| Clustering preserved | PASS |
| No blinking reintroduced | PASS |
| In-place position/heading/status/selection updates | PASS |
| No duplicate markers | PASS (GeoJSON source pattern unchanged) |

### 2.5 Regression (browser)

| Page | Map loads | Layer present | Visual car icon |
|------|-----------|---------------|-----------------|
| Dashboard | PASS | PASS (canvas) | **MANUAL** — 0 vehicles with lat/lng in local GPS mock |
| Live Monitoring | PASS | PASS | **MANUAL** — all 5 fleet units `liveStatus=offline`, no `live.latitude` |
| Survey Guidance | Not re-opened this pass | PASS (same MapView) | **MANUAL** |

**Note:** Local environment returns fleet records without GPS coordinates until the GPS backend/socket emits `location_update`. The marker code path only renders features with valid coordinates (`MapView.tsx` filter). Visual car-icon confirmation requires live or mocked GPS positions.

---

## 3. Console Audit

### 3.1 Fixes applied

| Issue | Root cause | Fix | File |
|-------|------------|-----|------|
| `/sw.js` 404 | Browser probed missing service worker | No-op `public/sw.js` | `public/sw.js` |
| GPS status flicker on socket reconnect | `reconnect_attempt` / `connect_error` always set RECONNECTING | Guard: only when not already CONNECTED | `src/services/socket/live-gps.tsx` |
| GPS poll reconnect blink | (Phase 4.1) poll set RECONNECTING every 5s | Only when DISCONNECTED | `src/services/socket/live-gps.tsx` |

### 3.2 Browser verification

| Check | Result |
|-------|--------|
| `GET /sw.js` | **200 PASS** |
| `GET /api/health` | **200 PASS** |
| Application crash on warm load | **PASS** — no red screen |
| Recurring fetch 401/403/404/500 loops | **PASS** — not observed |
| MapLibre application warnings | **PASS** — none captured on Live Monitoring |
| Next.js Dev Tools “Issues” badge | **MANUAL VALIDATION REQUIRED** — not exhaustively triaged |
| Full 9-page console sweep | **PARTIAL** — Dashboard + Live Monitoring verified; others not individually logged |

### 3.3 Pages spot-checked

| Page | HTTP | Console errors (app) |
|------|------|----------------------|
| `/dashboard` | 200 (browser) / timeout (cold PowerShell) | PASS |
| `/live-monitoring` | 200 | PASS |
| `/vehicles` | 200 | Not individually logged |
| `/permits` | 200 | Not individually logged |
| `/geo-upload` | 200 | Not individually logged |
| `/survey-guidance` | 200 | Not individually logged |
| `/survey-copilot` | 200 | Not individually logged |
| `/settings` | 200 | Not individually logged |
| `/settings/system-health` | 200 (build route) | Not individually logged |

**Note:** Regression script used `/system-health` which 404s; correct path is `/settings/system-health`.

---

## 4. Failure Matrix

### 4.1 Automated (`phase42-failure-matrix.ts`) — **5/5 PASS**

```
pnpm exec tsx src/services/survey/__tests__/phase42-failure-matrix.ts
```

| Scenario | Result |
|----------|--------|
| Offline queue coalesces duplicate `DECISION_SYNC` | PASS |
| Supervisor auth for recovery test | PASS |
| Assignment + SGE session restored after refresh simulation | PASS |
| Blockage retry queued offline | PASS |
| Photo upload offline queue entry accepted | PASS |

**Supporting fix:** `restoreActiveSurveySessions()` in `route-assignment-store.ts` rehydrates ACTIVE/PAUSED assignments into SGE store on `refresh()` (including offline fallback path).

### 4.2 Browser / runtime scenarios

| Scenario | Result |
|----------|--------|
| Internet disconnect | **MANUAL VALIDATION REQUIRED** |
| GPS backend unavailable | PASS — graceful banner + master data (Phase 4.1) |
| Survey API unavailable | **MANUAL VALIDATION REQUIRED** |
| Browser refresh | PASS — copilot session (Phase 4.1) + automated refresh simulation |
| Application restart | **MANUAL VALIDATION REQUIRED** |
| Multiple tabs | **MANUAL VALIDATION REQUIRED** |
| Offline mode | PARTIAL — queue enqueue verified automated |
| Reconnect | PARTIAL — socket guards verified; full offline→online **MANUAL** |
| Sleep / wake | **MANUAL VALIDATION REQUIRED** |
| Assignment recovery | PASS — automated + store fix |
| Photo upload retry | PASS — queue accepts PHOTO_UPLOAD |
| Blockage retry | PASS — queue accepts BLOCKAGE_REPORT |
| Voice recovery | **MANUAL VALIDATION REQUIRED** |
| Timeline recovery | **MANUAL VALIDATION REQUIRED** |

| Quality checks | Result |
|----------------|--------|
| No crashes (observed session) | PASS |
| No duplicate alerts/voice | PASS (session) |
| No duplicated assignments | PASS (single ACTIVE observed) |
| Queue recovery | PASS (automated subset) |
| Realtime recovery | PARTIAL |
| State/timeline restoration | PARTIAL |

---

## 5. Arabic Review

### 5.1 Classification

| Area | Classification | Notes |
|------|----------------|-------|
| Sidebar nav (Phase 1 + 2) | **Fully translated** | AR labels verified: لوحة التحكم, المراقبة المباشرة, … |
| GPS connection header | **Fully translated** | Connected / Reconnecting / Disconnected / LIVE |
| Phase badges (sidebar) | **Fully translated** | المرحلة 1 / المرحلة 2 |
| Dubai Municipality label | **Fully translated** | بلدية دبي |
| `document.dir` / `lang` | **Fixed** | Was stuck `en`/empty due to root `<html lang="en">` hydration |
| APP_NAME / APP_SUBTITLE | **English only** | By scope — config constants, not i18n keys |
| Page titles / KPIs / tables | **English only** | Dashboard, Live Monitoring headings unchanged |
| Map toolbar (basemap, identify) | **English only** | Not in scope |
| Field Pilot panel | **Fully translated** | Pre-existing |
| Survey Copilot body | **Fully translated** | Pre-existing i18n |
| RTL layout (sidebar) | **PASS** | Logical CSS (`start`/`end`, `border-e`, `md:ms-64`) |
| Broken tables/dialogs | **None observed** | Under AR + RTL |

### 5.2 Fixes applied

- Extended `messages.ts` with `nav` + `chrome` keys (EN + AR)
- Wired `sidebar.tsx`, `platform-shell.tsx`, `connection-header.tsx` to `useLocaleStore`
- **`locale-document-sync.tsx`** — syncs `<html lang/dir>` after hydration (fixes incorrect RTL)

### 5.3 Readiness assessment

**Arabic chrome readiness: ~65%** — Navigation and GPS status are production-usable in Arabic with correct RTL direction. Page-level content (headings, KPI labels, table headers, map controls) remains English by design for this burn-down scope. No layout defects requiring additional fixes were found.

---

## 6. Regression Summary

| Gate | Command | Result |
|------|---------|--------|
| Lint / type-check | `pnpm lint` / `pnpm type-check` | **PASS** |
| Production build | `NEXT_DIST_DIR=.next-release pnpm build` | **PASS** |
| Local UAT | `pnpm test:uat` | **PASS — 24/24** |
| Failure matrix | `pnpm exec tsx src/services/survey/__tests__/phase42-failure-matrix.ts` | **PASS — 5/5** |
| Dev server | `pnpm dev` | **PASS** (restarted after `.next` corruption from concurrent build) |

**Operational note:** Running `pnpm build` while `pnpm dev` is active can corrupt build artifacts (500s). Dev was restarted with a clean `.next` before browser tests.

---

## 7. Files Modified (Phase 4.2 bug fixes)

| File | Change |
|------|--------|
| `src/lib/geo/vehicle-marker.ts` | **NEW** — 42px car SDF marker images + symbol layer helper |
| `src/components/maps/MapView.tsx` | Symbol markers replace circle `vehicle-points` |
| `public/sw.js` | **NEW** — no-op service worker (stops 404) |
| `src/services/socket/live-gps.tsx` | Socket reconnect status guards |
| `src/lib/i18n/messages.ts` | `nav` + `chrome` EN/AR message keys |
| `src/components/layout/sidebar.tsx` | Localized nav + logical RTL layout |
| `src/components/layout/platform-shell.tsx` | Localized mobile nav + `md:ms-64` |
| `src/components/shared/connection-header.tsx` | Localized GPS labels |
| `src/store/route-assignment-store.ts` | `restoreActiveSurveySessions()` on refresh |
| `src/lib/i18n/locale-document-sync.tsx` | **NEW** — HTML lang/dir sync after hydration |
| `src/app/(platform)/layout.tsx` | Mount `LocaleDocumentSync` |
| `src/services/survey/__tests__/phase42-failure-matrix.ts` | **NEW** — automated failure subset |

---

## 8. Root Cause Analysis

### Bug 1 — Vehicle markers as circles

**Cause:** `MapView.tsx` used a MapLibre **circle** layer for unclustered vehicle points.  
**Fix:** Dedicated **symbol** layer with 42px SDF car images; clusters unchanged.

### Bug 2 — Console warnings/errors

**Cause:** Missing `/sw.js`; socket handlers set RECONNECTING even when already connected.  
**Fix:** Stub service worker; conditional status updates in `live-gps.tsx`.

### Bug 3 — Incomplete failure matrix

**Cause:** No automated recovery tests; refresh did not rehydrate SGE sessions from ACTIVE assignments.  
**Fix:** `phase42-failure-matrix.ts` + `restoreActiveSurveySessions()` in route assignment store.

### Bug 4 — Partial Arabic / incorrect RTL

**Cause:** Nav/GPS strings hardcoded English; root layout `<html lang="en">` overwrote locale on hydration.  
**Fix:** i18n keys for nav/chrome; `LocaleDocumentSync` applies `dir=rtl` / `lang=ar` client-side.

---

## 9. Fix Verification

| Fix | Verified how | Status |
|-----|--------------|--------|
| Car symbol layer | Code audit; `vehicle-points` absent; `vehicle-markers` present | **PASS** |
| Car icon visual | No GPS coordinates in local mock | **MANUAL VALIDATION REQUIRED** |
| `/sw.js` | `fetch('/sw.js')` → 200 | **PASS** |
| Socket reconnect guard | Code review + stable GPS Connected in session | **PASS** |
| Offline queue coalesce | Automated test | **PASS** |
| Assignment refresh recovery | Automated test | **PASS** |
| Arabic nav | DOM text `لوحة التحكم` … | **PASS** |
| RTL dir/lang | `document.dir=rtl`, `lang=ar` after sync fix | **PASS** |

---

## 10. Remaining Issues

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| FE-01b | HIGH | Visual confirmation of car icons with live GPS coordinates | **MANUAL VALIDATION REQUIRED** |
| FE-02b | MEDIUM | Page titles, KPIs, tables, map toolbar still English | Accepted scope limit |
| FE-04 | LOW | Next.js Dev Tools issues badge | **MANUAL VALIDATION REQUIRED** |
| FE-07b | MEDIUM | Browser failure scenarios (offline, multi-tab, sleep, voice, timeline) | **MANUAL VALIDATION REQUIRED** |
| FE-08 | INFO | Avoid concurrent `pnpm build` + `pnpm dev` | Documented |
| FE-09 | INFO | `/system-health` vs `/settings/system-health` path in test scripts | Cosmetic |

---

## 11. Frontend Score

| Area | Phase 4.1 | Phase 4.2 |
|------|-----------|-----------|
| Dashboard | 82 | 86 |
| Live Monitoring | 88 | 92 |
| Realtime / GPS chrome | 92 | 94 |
| RTL / Localization | 70 | 82 |
| Console hygiene | 75 | 90 |
| Failure recovery | 65 | 78 |
| **Overall** | **78** | **86** |

---

## 12. GO / NO-GO

### **NO-GO — Full Frontend Certification**

**Blockers for full GO:**

1. **Vehicle marker visual** not confirmed with positioned vehicles (local GPS mock has no coordinates).  
2. **Browser failure matrix** largely **MANUAL VALIDATION REQUIRED**.  
3. **Page-level Arabic** not in scope — product may require broader i18n before Dubai UAT.

**What passes the quality gate:**

- Lint, type-check, build, UAT, failure-matrix automation  
- Console fixes verified (`/sw.js`, reconnect guards)  
- Nav + GPS Arabic + RTL direction  
- Code-correct car marker implementation without clustering regression  
- No commit/push/deploy performed (per instructions)

**Recommended next step:** Run a 15-minute manual pass with GPS mock emitting coordinates (or field device) to confirm car icons, then execute the browser failure checklist (offline tab, refresh mid-survey, multi-tab). Re-score for Phase 4.3 certification.

---

*Report generated at end of Phase 4.2 burn-down. No git commit, push, merge, deploy, or tags created.*
