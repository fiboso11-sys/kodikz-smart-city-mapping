# Phase 2.1 — Voice Engine Specification

**Date:** 2026-07-15

---

## Purpose

Provide real-time audio guidance to the survey driver without requiring them to look at the screen. Uses the Web Speech API (browser-native TTS).

---

## Voice Events

| Event | Trigger | Message |
|-------|---------|---------|
| `LEAVING_ROUTE` | State → WARNING or OFF_ROUTE | "Warning: Leaving assigned route." |
| `WRONG_DIRECTION` | Sustained >90° for 5s | "Alert: Wrong direction detected. Please turn around." |
| `RETURN_TO_ROUTE` | 8s off route (voice escalation) | "Please return to the assigned route." |
| `BACK_ON_ROUTE` | State → ON_ROUTE from OFF_ROUTE/RETURNING | "Back on route. Continue surveying." |
| `STREET_MISSED` | Segment skipped (not implemented yet) | "A street segment was missed. Please review." |
| `SURVEY_COMPLETE` | Completion = 100% | "Survey route completed. Good job!" |
| `BLOCKAGE_RECORDED` | Blockage report submitted | "Road blockage recorded. Supervisor notified." |

---

## Cooldown Rules

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Cooldown period | 30 seconds | Minimum time between same event repeats |
| Max repeats | 3 | Maximum times same event speaks within cooldown window |

### Logic

```
if (elapsed_since_last_same_event < 30s AND count >= 3):
    SUPPRESS — do not speak
else if (elapsed_since_last_same_event < 30s):
    SPEAK — increment count
else:
    SPEAK — reset count to 1
```

---

## Time-Based Escalation

| Time Off Route | Action |
|----------------|--------|
| 3 seconds | Visual warning (UI only) |
| 8 seconds | Voice: "Please return to the assigned route." |
| 15 seconds | Supervisor alert (silent for driver, notifies supervisor) |

---

## Technical Implementation

### Web Speech API

```typescript
const utterance = new SpeechSynthesisUtterance(message);
utterance.rate = 0.9;   // Slightly slower for clarity
utterance.pitch = 1;    // Normal pitch
utterance.volume = 0.8; // 80% volume
window.speechSynthesis.speak(utterance);
```

### Fallback

If Web Speech API is unavailable:
- Events are still queued in `VoiceContext.pendingEvents`
- UI can display them as visual toast notifications
- Custom TTS service can consume the queue

### No Server Dependency

- Voice is entirely client-side
- No API calls required
- Works offline once the page is loaded

---

## Voice Context State

```typescript
interface VoiceContext {
  lastEventTimes: Partial<Record<VoiceEvent, number>>;
  eventCounts: Partial<Record<VoiceEvent, number>>;
  pendingEvents: Array<{ event: VoiceEvent; timestamp: number }>;
}
```

---

## Future Enhancements

- Configurable voice language (Arabic/English)
- Custom voice selection
- Volume based on vehicle speed
- Haptic feedback on mobile devices
