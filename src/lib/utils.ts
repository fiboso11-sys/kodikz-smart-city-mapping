import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDubaiDateTime } from "@/lib/time";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSpeed(kmh: number) {
  return `${Math.round(kmh)} km/h`;
}

export function formatTime(iso: string) {
  return formatDubaiDateTime(iso);
}

export const SEVERITY_COLORS = {
  Low: "#64748b",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#ef4444",
} as const;
