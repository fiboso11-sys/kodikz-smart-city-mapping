import { gpsApiUrl } from "@/lib/config";
import type { VehicleLivePosition } from "@/types";

export class GpsApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "GpsApiError";
  }
}

interface ApiVehicleRow {
  imei: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
  heading?: number;
  ignition?: boolean | null;
  receivedAt?: string;
  batteryVoltage?: number | null;
  externalPower?: boolean | null;
  gsmSignal?: number | null;
  satellites?: number | null;
}

const TIMEOUT_MS = 8000;

async function fetchGps<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${gpsApiUrl()}${path}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (res.status === 404) throw new GpsApiError("No GPS data", 404);
    if (!res.ok) throw new GpsApiError(`GPS API ${res.status}`, res.status);

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new GpsApiError(
        "GPS backend returned HTML — check NEXT_PUBLIC_GPS_API_URL points to the VPS API, not the Next.js app"
      );
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function isExternalGpsConfigured(): boolean {
  const url = gpsApiUrl();
  return !url.includes("localhost:3000") && !url.includes("127.0.0.1:3000");
}

export async function fetchLiveFromGpsBackend(): Promise<VehicleLivePosition[]> {
  try {
    const data = await fetchGps<{ vehicles: ApiVehicleRow[] }>("/vehicles");
    return (data.vehicles ?? []).map((v) => ({
      imei: v.imei,
      latitude: v.latitude,
      longitude: v.longitude,
      speed: v.speed ?? 0,
      heading: v.heading ?? 0,
      ignition: v.ignition ?? null,
      timestamp: v.timestamp,
      receivedAt: v.receivedAt,
      batteryVoltage: v.batteryVoltage,
      externalPower: v.externalPower,
      gsmSignal: v.gsmSignal,
      satellites: v.satellites,
    }));
  } catch (err) {
    if (err instanceof GpsApiError && err.status === 404) return [];
    throw err;
  }
}

export async function fetchHistoryFromGpsBackend(
  imei: string,
  limit = 50
): Promise<VehicleLivePosition[]> {
  const data = await fetchGps<{ points: ApiVehicleRow[] }>(
    `/history/${encodeURIComponent(imei)}?limit=${limit}`
  );
  return (data.points ?? []).map((v) => ({
    imei: v.imei,
    latitude: v.latitude,
    longitude: v.longitude,
    speed: v.speed ?? 0,
    heading: v.heading ?? 0,
    ignition: v.ignition ?? null,
    timestamp: v.timestamp,
    receivedAt: v.receivedAt,
  }));
}

export async function fetchGpsHealth() {
  return fetchGps<Record<string, unknown>>("/health");
}
