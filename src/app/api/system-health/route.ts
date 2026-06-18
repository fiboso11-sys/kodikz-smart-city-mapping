import { NextResponse } from "next/server";
import { getDbPath, isDatabaseReady } from "@/lib/db/sqlite";
import { gpsApiUrl, socketUrl } from "@/lib/config";
import { storageBackend } from "@/lib/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ModuleStatus = "ONLINE" | "OFFLINE";

async function checkGpsApi(): Promise<{ status: ModuleStatus; detail: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${gpsApiUrl()}/health`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const health = (await res.json()) as Record<string, unknown>;
    return {
      status: "ONLINE",
      detail: String(health.status ?? health.service ?? "OK"),
    };
  } catch (err) {
    return {
      status: "OFFLINE",
      detail: err instanceof Error ? err.message : "Unreachable",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const gps = await checkGpsApi();
  const dbReady = isDatabaseReady();

  const modules = {
    backendApi: {
      status: gps.status,
      url: gpsApiUrl(),
      detail: gps.detail,
    },
    socket: {
      status: gps.status,
      url: socketUrl(),
      detail: "Socket.IO — location_update",
    },
    database: {
      status: (dbReady ? "ONLINE" : "OFFLINE") as ModuleStatus,
      backend: storageBackend(),
      path: dbReady ? getDbPath() : null,
      detail: dbReady ? "SQLite persistence active" : "Using in-memory fallback",
    },
    geoUpload: {
      status: (dbReady ? "ONLINE" : "ONLINE") as ModuleStatus,
      detail: "GeoJSON validation & storage",
    },
  };

  const allOnline = Object.values(modules).every((m) => m.status === "ONLINE");

  return NextResponse.json({
    overall: allOnline ? "ONLINE" : "DEGRADED",
    checkedAt: new Date().toISOString(),
    modules,
  });
}
