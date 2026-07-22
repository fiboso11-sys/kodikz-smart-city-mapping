# Phase 4.2C — Map Rendering Root Cause Analysis

**Product:** Kodikz Smart City Mapping & Survey Guidance Platform  
**Branch:** `phase2/dubai-giscd-enhancements`  
**Date:** 2026-07-22  
**Environment:** `http://localhost:3000` · `.env.local` · live GPS via `api-kodikz.giantphoenixllc.com`  
**Scope:** Why Live Monitoring map was black/blank — diagnose; fix only if proven  
**Constraints:** No commit · No push · No merge · No deploy · No SGE / GPS / Socket.IO / Survey Guidance logic changes

---

## 1. Root Cause

**Application CSS conflict — not environmental tile failure.**

| Fact | Detail |
|------|--------|
| **Cause** | MapLibre CSS sets `.maplibregl-map { position: relative }`, which **overrides** Tailwind `absolute` on the map container |
| **Effect** | Container used `className="absolute inset-0"`. After MapLibre applied its class, `position` became `relative`, so `inset-0` no longer stretched the box → **computed height = 0px** |
| **Visible symptom** | Parent (`relative h-full min-h-[320px] overflow-hidden`) stayed ~940px tall but clipped a 0-height map → **solid dark/blank canvas** (page navy background) |
| **Not the cause** | Tile URLs, CSP, mixed content, CORS, expired Carto, internet, sprite/glyph URLs, style.json |

### Evidence (before fix)

```json
{
  "map": {
    "position": "relative",
    "height": "0px",
    "inset": "0px"
  },
  "parent": {
    "position": "relative",
    "height": "940.2px",
    "minHeight": "320px"
  },
  "className": "absolute inset-0 maplibregl-map"
}
```

### Style model (no remote style.json)

`buildOsmStyle()` returns an **inline** MapLibre `StyleSpecification` with a single raster source:

- Tiles: `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png`
- **No** `style` URL, **no** sprite URL, **no** glyph URL (raster-only)

### Network (not the failure)

| Check | Result |
|-------|--------|
| Carto tile HTTP | **200** |
| Browser `Image` + `crossOrigin=anonymous` | **PASS** (`imgOk`, 256×256) |
| Performance entries for cartocdn | Multiple tiles **status 200** |
| CSP in `next.config.ts` | **None** |
| Mixed content | **N/A** (HTTPS tiles from HTTPS/local app) |

Tiles were downloading successfully while the map container height was 0 — blank UI was a **layout** bug, not a tile provider outage.

---

## 2. Fix Applied (minimal, proven)

**File:** `src/components/maps/MapView.tsx`

1. **Container sizing** — replace `absolute inset-0` with `h-full w-full min-h-[320px]` so MapLibre’s `position: relative` still fills the parent.  
2. **`ResizeObserver`** — call `map.resize()` when the container size changes (flex/grid layout settle).  
3. **`map.resize()` on `load`** — ensure first paint after layout.  
4. **`map.on("error")`** — log MapLibre errors to console (diagnostics only).

No business logic, SGE, GPS processing, Socket.IO, or Survey Guidance changes.

### Evidence (after fix)

```json
{
  "className": "h-full w-full min-h-[320px] maplibregl-map",
  "mapH": 940,
  "mapW": 1220,
  "position": "relative",
  "heightCss": "940.2px",
  "canvasBuf": [1525, 1175]
}
```

Dashboard after fix: `mapH: 813`, `mapW: 1100`, same container classes.

---

## 3. Browser / Screenshot Evidence

| Artifact | Finding |
|----------|---------|
| Pre-fix Live Monitoring | Blank dark map; container height 0 |
| `phase42c-after-fix.png` | **Basemap visible** (Dubai / Palm / World Islands); CARTO attribution |
| `phase42c-pilot-selected.png` | Same; Pilot marker visible |
| `phase42c-dashboard-map.png` | Dashboard map **renders**; Pilot marker near Al Twar / Al Qusais |

Screenshots saved under the Cursor screenshots temp folder during the session (`phase42c-*.png`).

---

## 4. Vehicle Verification (Step 5)

| Check | Result |
|-------|--------|
| Pilot GPS Unit in fleet list | **PASS** — Idle, 0 km/h |
| Live API merge | **PASS** — `withLive=1`, IMEI `869616066613202` |
| Live coords (sample) | `lat≈25.2788`, `lng≈55.3742`, `heading≈215` |
| Appears near 25.28 / 55.35 | **PASS** — Al Twar / Al Qusais area on map |
| Marker shape | **PASS** — yellow/orange **car silhouette** (not a plain dot) |
| Status color / halo | **PASS** — idle yellow tint + circular halo visible |
| Heading rotation | **PARTIAL** — live heading 215; not independently measured at street zoom in screenshots |
| Selection / flyTo | **PARTIAL** — row click exercised; city-scale shot still shows single marker |
| No blinking / duplicates | **PASS** (observed session — single Pilot marker) |
| Clusters | N/A — only one live vehicle |

---

## 5. Console / DevTools

| Item | Result |
|------|--------|
| MapLibre tile 404/401/403 | **Not observed** for basemap tiles |
| Tile CORS | **PASS** for Image load |
| Next.js “N Issues” badge | Present (1–3) — **not fully triaged** to MapLibre; map still renders |
| Application `map.on("error")` | Added for future visibility |

---

## 6. Files Modified

| File | Change |
|------|--------|
| `src/components/maps/MapView.tsx` | Container `h-full w-full`; ResizeObserver + `map.resize()`; `error` listener |

**No other files. No git commit / push / deploy.**

---

## 7. Regression Result

| Check | Result |
|-------|--------|
| `pnpm type-check` | **PASS** |
| Live Monitoring basemap | **PASS** (screenshot) |
| Dashboard basemap | **PASS** (screenshot) |
| Pilot car marker | **PASS** (screenshot) |
| Tile provider | **PASS** (unchanged URLs) |
| GPS / Socket / SGE | **Unchanged** |

---

## 8. Environmental?

**No.** Host and browser could reach Carto tiles (HTTP 200) during the blank-map state. The blank appearance was caused by a **0-height MapLibre container** due to CSS class conflict inside the app.

---

## 9. GO / NO-GO

### **GO — Map blank-canvas root cause resolved**

Basemap now renders on Live Monitoring and Dashboard; Pilot GPS Unit car marker is visible near expected Dubai coordinates.

**Still outside this phase (carry from 4.2B):** full failure-matrix soak, full responsive matrix, street-level heading/selection stills, Next.js Issues badge triage.

---

*Phase 4.2C complete. Do not commit, push, merge, or deploy from this phase.*
