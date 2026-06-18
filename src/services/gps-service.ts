import { gpsApiUrl, socketUrl } from "@/lib/config";
import type { VehicleLivePosition } from "@/types";

export type GpsConnectionStatus = "CONNECTED" | "DISCONNECTED" | "RECONNECTING";

export class GpsServiceError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "GpsServiceError";
  }
}

export interface GpsHealthResponse {
  status?: string;
  service?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface GpsVehicleRow {
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

async function fetchGpsJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${gpsApiUrl()}${path}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new GpsServiceError(`Non-JSON response from ${path}`);
    }
    if (res.status === 404) throw new GpsServiceError("Not found", 404);
    if (!res.ok) throw new GpsServiceError(`GPS API ${res.status}`, res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function toLivePosition(row: GpsVehicleRow): VehicleLivePosition {
  return {
    imei: row.imei,
    latitude: row.latitude,
    longitude: row.longitude,
    speed: row.speed ?? 0,
    heading: row.heading ?? 0,
    ignition: row.ignition ?? null,
    timestamp: row.timestamp,
    receivedAt: row.receivedAt,
    batteryVoltage: row.batteryVoltage,
    externalPower: row.externalPower,
    gsmSignal: row.gsmSignal,
    satellites: row.satellites,
  };
}

export async function fetchGpsHealth(): Promise<GpsHealthResponse> {
  return fetchGpsJson<GpsHealthResponse>("/health");
}

export async function fetchLiveVehicles(): Promise<VehicleLivePosition[]> {
  try {
    const data = await fetchGpsJson<{ vehicles: GpsVehicleRow[] }>("/vehicles");
    return (data.vehicles ?? []).map(toLivePosition);
  } catch (err) {
    if (err instanceof GpsServiceError && err.status === 404) return [];
    throw err;
  }
}

export async function fetchVehicleByImei(imei: string): Promise<VehicleLivePosition | null> {
  try {
    const row = await fetchGpsJson<GpsVehicleRow>(`/vehicle/${encodeURIComponent(imei)}`);
    return toLivePosition(row);
  } catch (err) {
    if (err instanceof GpsServiceError && err.status === 404) return null;
    throw err;
  }
}

export async function fetchVehicleHistory(
  imei: string,
  limit = 50
): Promise<VehicleLivePosition[]> {
  const data = await fetchGpsJson<{ points: GpsVehicleRow[] }>(
    `/history/${encodeURIComponent(imei)}?limit=${limit}`
  );
  return (data.points ?? []).map(toLivePosition);
}

export function getSocketUrl(): string {
  return socketUrl();
}

export function getApiUrl(): string {
  return gpsApiUrl();
}
