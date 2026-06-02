import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSpeed(kmh: number) {
  return `${Math.round(kmh)} km/h`;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-AE", { timeZone: "Asia/Dubai" });
}

export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ${seconds % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function formatRelativeSeconds(iso: string | null, nowMs: number = Date.now()): string {
  if (!iso) return "—";
  const sec = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export const SEVERITY_COLORS = {
  Low: "#64748b",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#ef4444",
} as const;
