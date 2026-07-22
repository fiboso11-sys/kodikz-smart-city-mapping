/**
 * Typed Event Bus — pub/sub for all SGE platform events.
 * Subscribers: Voice, Supervisor, Audit, Playback, Reports, Notifications, Mobile.
 */

import type { EventSubscriber, SgePlatformEvent, SgePlatformEventType } from "../types/events";

let eventSeq = 0;

function nextEventId(): string {
  eventSeq += 1;
  return `evt-${Date.now()}-${eventSeq}`;
}

export class SgeEventBus {
  private subscribers = new Map<SgePlatformEventType | "*", Set<EventSubscriber>>();
  private history: SgePlatformEvent[] = [];
  private readonly maxHistory: number;

  constructor(maxHistory = 500) {
    this.maxHistory = maxHistory;
  }

  subscribe(type: SgePlatformEventType | "*", handler: EventSubscriber): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(handler);
    return () => {
      this.subscribers.get(type)?.delete(handler);
    };
  }

  publish(
    partial: Omit<SgePlatformEvent, "id"> & { id?: string }
  ): SgePlatformEvent {
    const event: SgePlatformEvent = {
      ...partial,
      id: partial.id ?? nextEventId(),
    };

    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    const typed = this.subscribers.get(event.type);
    typed?.forEach((h) => {
      try {
        h(event);
      } catch {
        /* isolate subscriber failures */
      }
    });

    const all = this.subscribers.get("*");
    all?.forEach((h) => {
      try {
        h(event);
      } catch {
        /* isolate */
      }
    });

    return event;
  }

  getHistory(limit = 50): readonly SgePlatformEvent[] {
    return this.history.slice(-limit);
  }

  clearHistory(): void {
    this.history = [];
  }

  subscriberCount(): number {
    let n = 0;
    this.subscribers.forEach((set) => {
      n += set.size;
    });
    return n;
  }
}

/** Singleton platform event bus */
export const sgeEventBus = new SgeEventBus();
