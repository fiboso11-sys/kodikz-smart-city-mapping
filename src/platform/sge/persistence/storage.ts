/**
 * Persistence keys and safe localStorage adapter.
 * Browser-only; no-ops on server.
 */

export const SGE_STORAGE_KEYS = {
  assignments: "kodikz.sge.assignments.v1",
  decisions: "kodikz.sge.decisions.v1",
  alerts: "kodikz.sge.alerts.v1",
  blockages: "kodikz.sge.blockages.v1",
  voiceHistory: "kodikz.sge.voice.v1",
  sessionProgress: "kodikz.sge.progress.v1",
  offlineQueue: "kodikz.sge.offline.v1",
  roadCache: "kodikz.sge.road-cache.v1",
} as const;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota / private mode — fail soft
  }
}

export function removeKey(key: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
