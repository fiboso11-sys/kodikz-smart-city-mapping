/**
 * Offline Mode — queue mutations while offline, auto-sync when online.
 * Handles conflicts: last-write-wins by updatedAt / createdAt.
 */

import { loadJson, saveJson, SGE_STORAGE_KEYS } from "../persistence/storage";
import type { CreateAssignmentInput } from "../types/assignment";

export type OfflineOpType =
  | "BLOCKAGE_REPORT"
  | "ASSIGNMENT_UPDATE"
  | "ALERT_ACK"
  | "PROGRESS_SYNC"
  | "DECISION_SYNC"
  | "VOICE_LOG"
  | "DRIVER_ACTION"
  | "TIMELINE_EVENT"
  | "PHOTO_UPLOAD";

export interface OfflineQueueItem {
  id: string;
  type: OfflineOpType;
  tenantId: string;
  vehicleId: string;
  assignmentId: string | null;
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  lastError: string | null;
}

export type OfflineSyncHandler = (item: OfflineQueueItem) => Promise<boolean>;

let offlineSeq = 0;

function nextOfflineId(): string {
  offlineSeq += 1;
  return `off-${Date.now()}-${offlineSeq}`;
}

export class OfflineQueue {
  private queue: OfflineQueueItem[] = [];
  private syncHandler: OfflineSyncHandler | null = null;
  private syncing = false;
  private lastFlushAt = 0;
  private lastFlushResult = { synced: 0, failed: 0 };

  constructor() {
    this.queue = loadJson<OfflineQueueItem[]>(SGE_STORAGE_KEYS.offlineQueue, []);
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        void this.flush();
      });
    }
  }

  setSyncHandler(handler: OfflineSyncHandler): void {
    this.syncHandler = handler;
  }

  enqueue(
    item: Omit<OfflineQueueItem, "id" | "createdAt" | "attempts" | "lastError">
  ): OfflineQueueItem {
    // Conflict coalescing: keep latest ASSIGNMENT_UPDATE / PROGRESS_SYNC per assignment
    if (
      (item.type === "ASSIGNMENT_UPDATE" || item.type === "PROGRESS_SYNC") &&
      item.assignmentId
    ) {
      this.queue = this.queue.filter(
        (q) => !(q.type === item.type && q.assignmentId === item.assignmentId)
      );
    }
    if (item.type === "DECISION_SYNC" && item.vehicleId) {
      this.queue = this.queue.filter(
        (q) => !(q.type === "DECISION_SYNC" && q.vehicleId === item.vehicleId)
      );
    }

    const entry: OfflineQueueItem = {
      ...item,
      id: nextOfflineId(),
      createdAt: Date.now(),
      attempts: 0,
      lastError: null,
    };
    this.queue.push(entry);
    this.persist();
    if (typeof navigator !== "undefined" && navigator.onLine) {
      void this.flush();
    }
    return entry;
  }

  getPending(): readonly OfflineQueueItem[] {
    return this.queue;
  }

  pendingCount(): number {
    return this.queue.length;
  }

  getLastFlush() {
    return { at: this.lastFlushAt, ...this.lastFlushResult };
  }

  isOnline(): boolean {
    return typeof navigator === "undefined" ? true : navigator.onLine;
  }

  async flush(): Promise<{ synced: number; failed: number }> {
    if (this.syncing || !this.syncHandler) return { synced: 0, failed: 0 };
    if (!this.isOnline()) return { synced: 0, failed: this.queue.length };

    this.syncing = true;
    let synced = 0;
    let failed = 0;
    const remaining: OfflineQueueItem[] = [];

    try {
      // FIFO — oldest first
      const sorted = [...this.queue].sort((a, b) => a.createdAt - b.createdAt);
      for (const item of sorted) {
        if (item.attempts >= 8) {
          // Dead-letter: drop after too many failures (graceful conflict abandon)
          failed += 1;
          continue;
        }
        try {
          const ok = await this.syncHandler(item);
          if (ok) {
            synced += 1;
          } else {
            remaining.push({
              ...item,
              attempts: item.attempts + 1,
              lastError: "sync rejected",
            });
            failed += 1;
          }
        } catch (err) {
          remaining.push({
            ...item,
            attempts: item.attempts + 1,
            lastError: err instanceof Error ? err.message : "sync error",
          });
          failed += 1;
        }
      }
      this.queue = remaining;
      this.persist();
      this.lastFlushAt = Date.now();
      this.lastFlushResult = { synced, failed };
    } finally {
      this.syncing = false;
    }

    return { synced, failed };
  }

  private persist(): void {
    saveJson(SGE_STORAGE_KEYS.offlineQueue, this.queue);
  }
}

export const offlineQueue = new OfflineQueue();

/** Production sync handler — posts queued ops to survey APIs */
offlineQueue.setSyncHandler(async (item) => {
  const { surveyApi } = await import("@/services/survey/client-api");
  switch (item.type) {
    case "BLOCKAGE_REPORT": {
      await surveyApi.postBlockage(item.payload as never);
      return true;
    }
    case "DECISION_SYNC": {
      const decision = item.payload.decision;
      if (decision) await surveyApi.postDecision(decision as never);
      return true;
    }
    case "PROGRESS_SYNC": {
      if (!item.assignmentId) return true;
      await surveyApi.postProgress({
        assignmentId: item.assignmentId,
        tenantId: item.tenantId,
        vehicleId: item.vehicleId,
        completionPct: Number(item.payload.completionPct ?? 0),
        completedSegmentIds: (item.payload.completedSegmentIds as string[]) ?? [],
        routeState: String(item.payload.routeState ?? "ON_ROUTE"),
        updatedAt: Date.now(),
      });
      return true;
    }
    case "ALERT_ACK": {
      await surveyApi.acknowledgeAlert(String(item.payload.alertId), String(item.payload.by));
      return true;
    }
    case "ASSIGNMENT_UPDATE": {
      const op = String(item.payload.op ?? "");
      const id = item.assignmentId;
      if (op === "pause" && id) await surveyApi.pause(id);
      else if (op === "resume" && id) await surveyApi.resume(id);
      else if (op === "complete" && id) await surveyApi.complete(id);
      else if (op === "cancel" && id) await surveyApi.cancel(id);
      else if (op === "createAndStart" && item.payload.input) {
        const input = item.payload.input as CreateAssignmentInput;
        await surveyApi.createAssignment({
          ...input,
          autoStart: true,
        });
      }
      return true;
    }
    case "VOICE_LOG":
    case "DRIVER_ACTION":
    case "TIMELINE_EVENT":
    case "PHOTO_UPLOAD":
      // Soft-ack — timeline rebuilt from audit on server
      return true;
    default:
      return true;
  }
});
