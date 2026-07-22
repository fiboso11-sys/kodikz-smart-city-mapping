/**
 * Professional Voice Copilot — queue, cooldown, mute, no overlap.
 * Consumes platform events / voice cues; does not recalculate SGE logic.
 */

import { getVoiceMessage, type VoiceEvent } from "@/engines/sge";
import { sgeEventBus, type SgePlatformEventType } from "@/platform/sge";

export type CopilotVoiceCue =
  | VoiceEvent
  | "SURVEY_STARTED"
  | "SURVEY_PAUSED"
  | "SURVEY_RESUMED"
  | "REMAIN_ON_ROUTE"
  | "NEED_SUPERVISOR"
  | "EMERGENCY";

const CUE_MESSAGES: Record<CopilotVoiceCue, string> = {
  SURVEY_STARTED: "Survey started.",
  SURVEY_PAUSED: "Survey paused.",
  SURVEY_RESUMED: "Survey resumed.",
  REMAIN_ON_ROUTE: "Remain on assigned route.",
  LEAVING_ROUTE: "Leaving assigned survey route.",
  WRONG_DIRECTION: "Wrong direction.",
  RETURN_TO_ROUTE: "Return when safe.",
  BACK_ON_ROUTE: "Back on route. Continue surveying.",
  STREET_MISSED: "A street segment was missed.",
  SURVEY_COMPLETE: "Survey complete.",
  BLOCKAGE_RECORDED: "Road blockage reported.",
  NEED_SUPERVISOR: "Supervisor assistance requested.",
  EMERGENCY: "Emergency alert sent to supervisor.",
};

const EVENT_TO_CUE: Partial<Record<SgePlatformEventType, CopilotVoiceCue>> = {
  SURVEY_STARTED: "SURVEY_STARTED",
  SURVEY_PAUSED: "SURVEY_PAUSED",
  SURVEY_RESUMED: "SURVEY_RESUMED",
  SURVEY_COMPLETED: "SURVEY_COMPLETE",
  WARNING: "LEAVING_ROUTE",
  OFF_ROUTE: "LEAVING_ROUTE",
  WRONG_DIRECTION: "WRONG_DIRECTION",
  RETURNING: "RETURN_TO_ROUTE",
  BACK_ON_ROUTE: "BACK_ON_ROUTE",
  BLOCKAGE_REPORTED: "BLOCKAGE_RECORDED",
  ON_ROUTE: "REMAIN_ON_ROUTE",
};

export interface VoiceHistoryEntry {
  cue: CopilotVoiceCue;
  message: string;
  timestamp: number;
  spoken: boolean;
}

type VoiceListener = (history: VoiceHistoryEntry[]) => void;

export class VoiceCopilotQueue {
  private queue: CopilotVoiceCue[] = [];
  private speaking = false;
  private muted = false;
  private volume = 0.85;
  private cooldownMs = 25_000;
  private lastSpoken = new Map<CopilotVoiceCue, number>();
  private history: VoiceHistoryEntry[] = [];
  private listeners = new Set<VoiceListener>();
  private unsub: (() => void) | null = null;
  private vehicleFilter: string | null = null;

  start(vehicleId?: string | null): void {
    this.stop();
    this.vehicleFilter = vehicleId ?? null;
    this.unsub = sgeEventBus.subscribe("*", (event) => {
      if (this.vehicleFilter && event.vehicleId !== this.vehicleFilter) return;
      const cue = EVENT_TO_CUE[event.type];
      if (cue) this.enqueue(cue);
    });
  }

  stop(): void {
    this.unsub?.();
    this.unsub = null;
    this.queue = [];
    this.speaking = false;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.speaking = false;
      this.queue = [];
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
  }

  getVolume(): number {
    return this.volume;
  }

  getHistory(): VoiceHistoryEntry[] {
    return [...this.history];
  }

  subscribe(listener: VoiceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  enqueue(cue: CopilotVoiceCue): void {
    const now = Date.now();
    const last = this.lastSpoken.get(cue) ?? 0;
    if (now - last < this.cooldownMs && cue !== "EMERGENCY" && cue !== "NEED_SUPERVISOR") {
      this.pushHistory(cue, false);
      return;
    }

    // Avoid duplicate consecutive cues in queue
    if (this.queue[this.queue.length - 1] === cue) return;
    this.queue.push(cue);
    this.drain();
  }

  testVolume(): void {
    this.speakNow("Volume test. Survey Copilot is ready.");
  }

  private drain(): void {
    if (this.speaking || this.muted || this.queue.length === 0) return;
    const cue = this.queue.shift()!;
    this.lastSpoken.set(cue, Date.now());
    this.pushHistory(cue, true);
    this.speakNow(CUE_MESSAGES[cue] ?? getVoiceMessage(cue as VoiceEvent), () => {
      this.speaking = false;
      this.drain();
    });
  }

  private speakNow(text: string, onEnd?: () => void): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }
    this.speaking = true;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.92;
      u.volume = this.volume;
      u.onend = () => onEnd?.();
      u.onerror = () => onEnd?.();
      window.speechSynthesis.speak(u);
    } catch {
      this.speaking = false;
      onEnd?.();
    }
  }

  private pushHistory(cue: CopilotVoiceCue, spoken: boolean): void {
    this.history.push({
      cue,
      message: CUE_MESSAGES[cue],
      timestamp: Date.now(),
      spoken,
    });
    if (this.history.length > 80) this.history = this.history.slice(-80);
    this.listeners.forEach((l) => {
      try {
        l(this.getHistory());
      } catch {
        /* isolate */
      }
    });
  }
}

export const voiceCopilot = new VoiceCopilotQueue();

export function getCopilotVoiceMessage(cue: CopilotVoiceCue): string {
  return CUE_MESSAGES[cue];
}
