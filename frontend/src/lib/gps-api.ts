/** Live GPS REST API (Node backend on VPS — not Vercel). */

import type { VehicleTelemetry } from "@/types/telemetry";

export interface ApiVehicleLocation extends VehicleTelemetry {
  imei: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
  heading?: number;
  receivedAt?: string;
}

export interface ApiVehiclesResponse {
  vehicles: ApiVehicleLocation[];
  count: number;
}

export interface HealthResponse {
  status: string;
  service?: string;
  version?: string;
  environment: string;
  dataMode?: "simulation" | "live";
  timestamp: string;
  uptimeSec: number;
  checks: { tcp: string; http: string };
  devices: number;
  connectedDevices?: number;
  reportingDevices?: number;
  lastPacketReceivedAt: string | null;
  protocol?: {
    supported: string[];
    notSupported?: string[];
    verifyAvlCodecId?: string;
  };
  warnings?: string[];
}

export class GpsApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "GpsApiError";
  }
}

const FETCH_TIMEOUT_MS = 8000;

const baseUrl = () =>
  (process.env.NEXT_PUBLIC_GPS_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function fetchJson<T>(
  path: string
): Promise<{ ok: true; data: T } | { ok: false; error: GpsApiError }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (res.status === 404) {
      return { ok: false, error: new GpsApiError("No GPS data yet", 404) };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: new GpsApiError(`GPS API ${path} → ${res.status}`, res.status),
      };
    }

    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: new GpsApiError("GPS API request timed out", undefined, err) };
    }
    const message = err instanceof Error ? err.message : "GPS API unreachable";
    return { ok: false, error: new GpsApiError(message, undefined, err) };
  } finally {
    clearTimeout(timeout);
  }
}

/** GET /vehicles — full fleet snapshot (one poll for all devices). */
export async function fetchAllVehicleLocations(): Promise<ApiVehicleLocation[]> {
  const result = await fetchJson<ApiVehiclesResponse>("/vehicles");
  if (!result.ok) {
    if (result.error.status === 404) return [];
    throw result.error;
  }
  return result.data.vehicles ?? [];
}

/** GET /vehicle/:imei */
export async function fetchVehicleByImei(imei: string): Promise<ApiVehicleLocation | null> {
  const result = await fetchJson<ApiVehicleLocation>(
    `/vehicle/${encodeURIComponent(imei)}`
  );
  if (result.ok) return result.data;
  if (result.error.status === 404) return null;
  throw result.error;
}

/** GET /vehicle?imei= — backward compatible */
export async function fetchLatestVehicleLocation(
  imei?: string
): Promise<ApiVehicleLocation | null> {
  if (imei) return fetchVehicleByImei(imei);
  const result = await fetchJson<ApiVehicleLocation>("/vehicle");
  if (result.ok) return result.data;
  if (result.error.status === 404) return null;
  throw result.error;
}

export interface FleetVehicleRef {
  id: string;
  imei: string | null;
}

/** Fleet poll — prefer GET /vehicles. */
export async function fetchVehicleLocationsForFleet(
  _fleet?: FleetVehicleRef[]
): Promise<ApiVehicleLocation[]> {
  return fetchAllVehicleLocations();
}

/** GET /health — backend & device telemetry (no API key required). */
export async function fetchHealth(): Promise<HealthResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl()}/health`, {
      cache: "no-store",
      signal: controller.signal,
    });
    const data = (await res.json()) as HealthResponse;
    if (!res.ok && res.status !== 503) {
      throw new GpsApiError(`GPS API /health → ${res.status}`, res.status);
    }
    return data;
  } catch (err) {
    if (err instanceof GpsApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new GpsApiError("Health check timed out", undefined, err);
    }
    const message = err instanceof Error ? err.message : "Health check failed";
    throw new GpsApiError(message, undefined, err);
  } finally {
    clearTimeout(timeout);
  }
}
