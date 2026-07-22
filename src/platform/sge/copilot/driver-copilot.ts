/**
 * Driver Copilot Foundation — service interfaces only.
 * Full mobile UI is intentionally deferred.
 */

import type { SurveyDecision } from "../types/decision";
import type { VoiceEvent } from "@/engines/sge";
import { getVoiceMessage } from "@/engines/sge";
import { decisionBus } from "../decision-bus/decision-bus";
import { sgeEventBus } from "../event-bus/event-bus";
import { sessionManager } from "../session/session-manager";

export interface GpsHealthStatus {
  accuracy: number;
  quality: "GOOD" | "FAIR" | "POOR" | "UNRELIABLE";
  lastFixAt: number | null;
}

export interface BatteryStatus {
  level: number | null;
  charging: boolean | null;
}

export interface DriverCopilotState {
  vehicleId: string;
  assignmentId: string | null;
  decision: SurveyDecision | null;
  voiceEnabled: boolean;
  backgroundMode: boolean;
  gpsHealth: GpsHealthStatus;
  battery: BatteryStatus;
  progressPct: number;
  routeState: string;
}

export interface DriverCopilotService {
  attach(vehicleId: string): void;
  detach(): void;
  getState(): DriverCopilotState | null;
  setVoiceEnabled(enabled: boolean): void;
  setBackgroundMode(enabled: boolean): void;
  speak(event: VoiceEvent): void;
  onDecision(handler: (d: SurveyDecision) => void): () => void;
}

function gpsQuality(accuracy: number): GpsHealthStatus["quality"] {
  if (accuracy <= 10) return "GOOD";
  if (accuracy <= 25) return "FAIR";
  if (accuracy <= 40) return "POOR";
  return "UNRELIABLE";
}

/**
 * Browser foundation for future mobile driver copilot.
 * Speaks via Web Speech API; exposes decision stream.
 */
export class BrowserDriverCopilot implements DriverCopilotService {
  private vehicleId: string | null = null;
  private voiceEnabled = true;
  private backgroundMode = false;
  private unsub: (() => void) | null = null;
  private lastDecision: SurveyDecision | null = null;

  attach(vehicleId: string): void {
    this.detach();
    this.vehicleId = vehicleId;
    this.unsub = decisionBus.subscribeVehicle(vehicleId, (d) => {
      this.lastDecision = d;
      if (this.voiceEnabled && d.voiceEvent) {
        this.speak(d.voiceEvent);
      }
    });
  }

  detach(): void {
    this.unsub?.();
    this.unsub = null;
    this.vehicleId = null;
    this.lastDecision = null;
  }

  getState(): DriverCopilotState | null {
    if (!this.vehicleId) return null;
    const session = sessionManager.getSession(this.vehicleId);
    const d = this.lastDecision ?? decisionBus.getLatest(this.vehicleId);
    return {
      vehicleId: this.vehicleId,
      assignmentId: d?.assignmentId ?? session?.assignment.id ?? null,
      decision: d,
      voiceEnabled: this.voiceEnabled,
      backgroundMode: this.backgroundMode,
      gpsHealth: {
        accuracy: d?.gpsAccuracy ?? 999,
        quality: gpsQuality(d?.gpsAccuracy ?? 999),
        lastFixAt: d?.timestamp ?? null,
      },
      battery: { level: null, charging: null },
      progressPct: d?.completionPct ?? 0,
      routeState: d?.routeState ?? "NOT_STARTED",
    };
  }

  setVoiceEnabled(enabled: boolean): void {
    this.voiceEnabled = enabled;
  }

  setBackgroundMode(enabled: boolean): void {
    this.backgroundMode = enabled;
  }

  speak(event: VoiceEvent): void {
    if (!this.voiceEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      const utterance = new SpeechSynthesisUtterance(getVoiceMessage(event));
      utterance.rate = 0.9;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch {
      /* TTS unavailable */
    }
  }

  onDecision(handler: (d: SurveyDecision) => void): () => void {
    if (!this.vehicleId) return () => undefined;
    return decisionBus.subscribeVehicle(this.vehicleId, handler);
  }
}

export const driverCopilot = new BrowserDriverCopilot();

/** Wire survey-start voice cue via event bus */
sgeEventBus.subscribe("SURVEY_STARTED", () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance("Survey started.");
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
});
