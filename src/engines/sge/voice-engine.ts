/**
 * Survey Guidance Engine — Voice Engine
 *
 * Manages voice/audio cue events for the driver with cooldown logic.
 * Uses the Web Speech API when available; otherwise queues events for UI display.
 */

import { getSgeConfig } from "./config";
import type { VoiceEvent } from "./types";

const VOICE_MESSAGES: Record<VoiceEvent, string> = {
  LEAVING_ROUTE: "Warning: Leaving assigned route.",
  WRONG_DIRECTION: "Alert: Wrong direction detected. Please turn around.",
  RETURN_TO_ROUTE: "Please return to the assigned route.",
  BACK_ON_ROUTE: "Back on route. Continue surveying.",
  STREET_MISSED: "A street segment was missed. Please review.",
  SURVEY_COMPLETE: "Survey route completed. Good job!",
  BLOCKAGE_RECORDED: "Road blockage recorded. Supervisor notified.",
};

export interface VoiceContext {
  lastEventTimes: Partial<Record<VoiceEvent, number>>;
  eventCounts: Partial<Record<VoiceEvent, number>>;
  pendingEvents: Array<{ event: VoiceEvent; timestamp: number }>;
}

export function createVoiceContext(): VoiceContext {
  return {
    lastEventTimes: {},
    eventCounts: {},
    pendingEvents: [],
  };
}

export interface VoiceResult {
  spoken: boolean;
  message: string | null;
  updatedCtx: VoiceContext;
}

export function emitVoiceEvent(
  ctx: VoiceContext,
  event: VoiceEvent,
  timestamp: number
): VoiceResult {
  const cfg = getSgeConfig().voice;
  const updatedCtx: VoiceContext = {
    lastEventTimes: { ...ctx.lastEventTimes },
    eventCounts: { ...ctx.eventCounts },
    pendingEvents: [...ctx.pendingEvents],
  };

  const lastTime = ctx.lastEventTimes[event] ?? 0;
  const count = ctx.eventCounts[event] ?? 0;
  const elapsed = timestamp - lastTime;

  if (elapsed < cfg.cooldownMs && count >= cfg.maxRepeats) {
    return { spoken: false, message: null, updatedCtx };
  }

  if (elapsed < cfg.cooldownMs) {
    updatedCtx.eventCounts[event] = count + 1;
  } else {
    updatedCtx.eventCounts[event] = 1;
  }

  updatedCtx.lastEventTimes[event] = timestamp;
  updatedCtx.pendingEvents.push({ event, timestamp });

  const message = VOICE_MESSAGES[event];

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech API unavailable; event still queued for UI
    }
  }

  return { spoken: true, message, updatedCtx };
}

export function clearPendingEvents(ctx: VoiceContext): VoiceContext {
  return { ...ctx, pendingEvents: [] };
}

export function getVoiceMessage(event: VoiceEvent): string {
  return VOICE_MESSAGES[event];
}
