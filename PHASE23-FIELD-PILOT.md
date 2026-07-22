# Phase 2.3 — Field Pilot Mode

**Purpose:** Dubai GISCD field pilot diagnostics without polluting production UI.

## Enable

- Keyboard: `Ctrl+Shift+P`
- URL: `?pilot=1`

## Panel shows

- Socket / SSE sync health
- Store sync status
- Offline queue pending count
- GPS quality
- Live vehicle count
- API latency
- Voice history length
- Current assignment + route state + completion %
- Last survey event type
- Locale toggle EN ↔ AR (RTL)

## Component

`src/components/pilot/field-pilot-panel.tsx` — mounted from `SgeProvider`.
