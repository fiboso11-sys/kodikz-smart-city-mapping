# Phase 2.2 — Voice Copilot

**Module:** `src/platform/sge/voice/voice-copilot.ts`

---

## Features
- Single speech queue (no overlap)
- Cooldown (25s) — skips excessive repeats
- Mute / volume / volume test
- History with spoken vs cooldown-suppressed entries
- Vehicle-filtered event subscription

## Cue Map (from Event Bus)
| Event | Voice |
|-------|-------|
| SURVEY_STARTED | Survey started. |
| ON_ROUTE | Remain on assigned route. |
| WARNING / OFF_ROUTE | Leaving assigned survey route. |
| WRONG_DIRECTION | Wrong direction. |
| RETURNING | Return when safe. |
| BACK_ON_ROUTE | Back on route… |
| BLOCKAGE_REPORTED | Road blockage reported. |
| SURVEY_PAUSED / RESUMED | Survey paused / resumed. |
| SURVEY_COMPLETED | Survey complete. |

## Manual Cues
Need Supervisor · Emergency · Volume test

## Rule
Voice never invents survey state — it only speaks cues triggered by SGE/Event Bus.
