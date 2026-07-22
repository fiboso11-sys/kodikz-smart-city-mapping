/**
 * Decision Bus — stores immutable decisions per vehicle.
 * Consumers subscribe; nothing recalculates SGE logic.
 */

import type { SurveyDecision } from "../types/decision";
import { loadJson, saveJson, SGE_STORAGE_KEYS } from "../persistence/storage";

export type DecisionSubscriber = (decision: SurveyDecision) => void;

const MAX_HISTORY_PER_VEHICLE = 200;
const MAX_PERSISTED_PER_VEHICLE = 50;

export class DecisionBus {
  private latestByVehicle = new Map<string, SurveyDecision>();
  private historyByVehicle = new Map<string, SurveyDecision[]>();
  private subscribers = new Set<DecisionSubscriber>();
  private vehicleSubscribers = new Map<string, Set<DecisionSubscriber>>();

  constructor() {
    this.restore();
  }

  publish(decision: SurveyDecision): void {
    this.latestByVehicle.set(decision.vehicleId, decision);

    const hist = this.historyByVehicle.get(decision.vehicleId) ?? [];
    hist.push(decision);
    if (hist.length > MAX_HISTORY_PER_VEHICLE) {
      hist.splice(0, hist.length - MAX_HISTORY_PER_VEHICLE);
    }
    this.historyByVehicle.set(decision.vehicleId, hist);

    this.persist();

    this.subscribers.forEach((h) => {
      try {
        h(decision);
      } catch {
        /* isolate */
      }
    });

    this.vehicleSubscribers.get(decision.vehicleId)?.forEach((h) => {
      try {
        h(decision);
      } catch {
        /* isolate */
      }
    });
  }

  getLatest(vehicleId: string): SurveyDecision | null {
    return this.latestByVehicle.get(vehicleId) ?? null;
  }

  getAllLatest(): SurveyDecision[] {
    return Array.from(this.latestByVehicle.values());
  }

  getHistory(vehicleId: string, limit = 50): SurveyDecision[] {
    const hist = this.historyByVehicle.get(vehicleId) ?? [];
    return hist.slice(-limit);
  }

  subscribe(handler: DecisionSubscriber): () => void {
    this.subscribers.add(handler);
    return () => {
      this.subscribers.delete(handler);
    };
  }

  subscribeVehicle(vehicleId: string, handler: DecisionSubscriber): () => void {
    if (!this.vehicleSubscribers.has(vehicleId)) {
      this.vehicleSubscribers.set(vehicleId, new Set());
    }
    this.vehicleSubscribers.get(vehicleId)!.add(handler);
    return () => {
      this.vehicleSubscribers.get(vehicleId)?.delete(handler);
    };
  }

  clearVehicle(vehicleId: string): void {
    this.latestByVehicle.delete(vehicleId);
    this.historyByVehicle.delete(vehicleId);
    this.persist();
  }

  private persist(): void {
    const payload: Record<string, SurveyDecision[]> = {};
    this.historyByVehicle.forEach((hist, vehicleId) => {
      payload[vehicleId] = hist.slice(-MAX_PERSISTED_PER_VEHICLE);
    });
    saveJson(SGE_STORAGE_KEYS.decisions, payload);
  }

  private restore(): void {
    const payload = loadJson<Record<string, SurveyDecision[]>>(
      SGE_STORAGE_KEYS.decisions,
      {}
    );
    for (const [vehicleId, hist] of Object.entries(payload)) {
      if (!Array.isArray(hist) || hist.length === 0) continue;
      this.historyByVehicle.set(vehicleId, hist);
      this.latestByVehicle.set(vehicleId, hist[hist.length - 1]);
    }
  }
}

export const decisionBus = new DecisionBus();
