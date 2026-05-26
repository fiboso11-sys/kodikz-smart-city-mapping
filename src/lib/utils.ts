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

export const SEVERITY_COLORS = {
  Low: "#64748b",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#ef4444",
} as const;
