export const APP_NAME = "Dubai Street Mapping Monitoring System";
export const APP_SUBTITLE = "Dubai Municipality GIS Center Department";
export const APP_TAGLINE = "Street Mapping Monitoring & Compliance Platform";

export const DUBAI_CENTER: [number, number] = [55.2708, 25.2048];
export const DEFAULT_ZOOM = 11;

/** Offline if last update older than 10 minutes */
export const OFFLINE_THRESHOLD_MS = 10 * 60 * 1000;
/** Moving if speed above 5 km/h */
export const MOVING_SPEED_KMH = 5;

const DEFAULT_GPS_API = "https://api-kodikz.giantphoenixllc.com";

export function gpsApiUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_GPS_API_URL ??
    DEFAULT_GPS_API;
  return url.replace(/\/$/, "");
}

export function socketUrl(): string {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? gpsApiUrl();
  return url.replace(/\/$/, "");
}

export function mapProvider(): string {
  return process.env.NEXT_PUBLIC_MAP_PROVIDER ?? "maplibre";
}

export function isGpsConfigured(): boolean {
  const url = gpsApiUrl();
  return !url.includes("localhost:3000") && !url.includes("127.0.0.1:3000");
}

export function usePostgres(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim());
}

export function isDevelopment(): boolean {
  const mode = process.env.DEPLOYMENT_MODE?.trim();
  if (mode === "pilot" || mode === "municipality") return false;
  if (mode === "local") return true;
  return process.env.NODE_ENV !== "production";
}

export { loadAppConfig, getAppConfig, resolveDeploymentMode } from "@/lib/config/app-config";
