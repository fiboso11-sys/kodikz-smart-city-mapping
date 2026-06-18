# Phase 1 Audit Fix List — Dubai Street Mapping Monitoring System

Ordered by priority. Do not start P2/P3 until P0/P1 are resolved for Dubai handoff.

---

## P0 — Build broken / app not running / blocking handoff

| # | Task | Module | Effort |
|---|------|--------|--------|
| P0-1 | **Document and verify deploy entry point** — README must state: deploy **repository root** (`pnpm build`), not `frontend/` or `backend/` alone | Ops | S |
| P0-2 | **End-to-end GPS integration test** — set `NEXT_PUBLIC_GPS_API_URL`, confirm `/api/vehicles/live` returns live coordinates, map markers appear, Socket `location_update` fires | Realtime | M |
| P0-3 | **Register pilot IMEIs** in Vehicle Master matching real FMM130 devices before Dubai demo | Vehicles | S |

*No P0 code build failures at audit time (`tsc --noEmit` pass). P0 items are integration/deploy blockers.*

---

## P1 — Required Phase 1 feature missing or incomplete

| # | Task | Module | Effort |
|---|------|--------|--------|
| P1-1 | **Fix `public/manifest.json`** — name/short_name/description → "Dubai Street Mapping Monitoring System" | Identity | S |
| P1-2 | **Remove or redirect Kodikz marketing** — `(marketing)/landing-page.tsx` still vendor-branded; root redirects to `/dashboard` but manifest/PWA metadata wrong | Identity | S |
| P1-3 | **Dashboard vehicle list panel** — add scrollable fleet list beside map (not only search + map click) | Dashboard | M |
| P1-4 | **Permit form: Assigned Vehicles** — multi-select or IMEI picker bound to `assignedVehicleIds` | Permits | M |
| P1-5 | **Live Monitoring "Online" filter** — add filter for moving+idle combined, or rename filters to match spec | Live Monitoring | S |
| P1-6 | **Disclose mock persistence in README/handoff** — vehicles/permits/geo uploads reset on server restart | API/Data | S |
| P1-7 | **Geo upload drag-and-drop** — add `onDrop` / `onDragOver` handlers (UI says "Drop" but only file input works) | Geo Upload | S |
| P1-8 | **Handoff package for Dubai server team** — single doc: env vars, Vercel deploy, GPS backend URL, firewall ports 5000/443 | Ops | M |

---

## P2 — UI/UX improvement (spec-adjacent)

| # | Task | Module | Effort |
|---|------|--------|--------|
| P2-1 | **Pagination** on `/vehicles` and `/permits` tables | CRUD | M |
| P2-2 | **Column sort** on vehicle and permit tables | CRUD | M |
| P2-3 | **Layer opacity slider** for route/area layers in map toolbar | GIS Tools | M |
| P2-4 | **Zoom to layer** — fly to bounds of selected geo upload | GIS Tools | S |
| P2-5 | **Mobile vehicle detail panel** — dashboard detail panel hidden on small screens (`lg:block` only) | Dashboard | S |
| P2-6 | **Extract `src/components/vehicles/` and `src/components/permits/`** from inline page code per spec structure | Structure | M |
| P2-7 | **Violations Today KPI** — wire to real count or label as "Phase 2" / hide until implemented | Dashboard | S |

---

## P3 — Future enhancement (Phase 2+)

| # | Task | Module | Effort |
|---|------|--------|--------|
| P3-1 | **PostgreSQL + PostGIS** — replace `mock-repository.ts` with persistent store | Data | L |
| P3-2 | **SHP / KML / GDB upload** support | Geo Upload | L |
| P3-3 | **Violations engine** + compliance against approved routes/areas | Violations | L |
| P3-4 | **Route Management / Area Management** modules (currently Coming Soon) | Phase 2 | L |
| P3-5 | **Analytics & Reports** modules | Phase 2 | L |
| P3-6 | **SSO / Dubai Municipality identity** | Security | L |
| P3-7 | **Self-hosted or ESRI basemap** option for government production | GIS | M |
| P3-8 | **Archive legacy code** — `src/components/map/live-map.tsx`, simulator `app-store`, duplicate `frontend/` | Cleanup | M |
| P3-9 | **Enable ESLint** in CI (`eslint.ignoreDuringBuilds: false`) | Quality | S |

---

## Suggested fix order (sprint)

1. P0-1, P0-2, P0-3 (integration)
2. P1-1, P1-2 (branding)
3. P1-6, P1-8 (handoff docs)
4. P1-3, P1-4, P1-5, P1-7 (spec gaps)
5. P2 items as time allows before formal GISCD sign-off

---

**Effort key:** S = small (&lt;2h), M = medium (2–8h), L = large (&gt;1 day)
