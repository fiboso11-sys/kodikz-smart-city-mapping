import { NextResponse } from "next/server";
import { gpsApiUrl, socketUrl, isGpsConfigured } from "@/lib/config";
import { storageBackend } from "@/lib/repositories";
import { isDatabaseReady } from "@/lib/db/sqlite";
import { postgresHealthCheck, isPostgresConfigured, getPostgresPool } from "@/lib/db/postgres/pool";
import { getObjectStorage } from "@/lib/storage/object-storage";
import {
  getReleaseIdentity,
  type ComponentHealthStatus,
  type OverallHealthStatus,
} from "@/lib/release-identity";
import { POSTGRES_SCHEMA_VERSION } from "@/lib/db/postgres/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ComponentResult = {
  status: ComponentHealthStatus;
  responseTimeMs?: number;
  lastCheckedAt: string;
  message: string;
  configured: boolean;
};

function stripCredentials(url: string): string {
  try {
    const u = new URL(url);
    if (u.username || u.password) {
      u.username = "";
      u.password = "";
    }
    return u.toString().replace(/\/\/:@/, "//");
  } catch {
    return "[invalid-url]";
  }
}

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const t0 = Date.now();
  const value = await fn();
  return { value, ms: Date.now() - t0 };
}

async function checkGps(): Promise<ComponentResult> {
  const checked = new Date().toISOString();
  if (!isGpsConfigured()) {
    return {
      status: "not_configured",
      lastCheckedAt: checked,
      message: "GPS backend URL not configured for external use",
      configured: false,
    };
  }
  try {
    const { value: res, ms } = await timed(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        return await fetch(`${gpsApiUrl()}/health`, {
          cache: "no-store",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    });
    if (!res.ok) {
      return {
        status: "unavailable",
        responseTimeMs: ms,
        lastCheckedAt: checked,
        message: `GPS health HTTP ${res.status}`,
        configured: true,
      };
    }
    return {
      status: "healthy",
      responseTimeMs: ms,
      lastCheckedAt: checked,
      message: "GPS backend health OK",
      configured: true,
    };
  } catch {
    return {
      status: "unavailable",
      lastCheckedAt: checked,
      message: "GPS backend unreachable",
      configured: true,
    };
  }
}

async function checkDatabase(): Promise<ComponentResult & { migrationVersion?: string }> {
  const checked = new Date().toISOString();
  if (isPostgresConfigured()) {
    const pg = await postgresHealthCheck();
    if (!pg.ok) {
      return {
        status: pg.error === "not_configured" ? "not_configured" : "unavailable",
        responseTimeMs: pg.latencyMs,
        lastCheckedAt: checked,
        message: pg.error === "not_configured" ? "PostgreSQL not configured" : "PostgreSQL unreachable",
        configured: pg.error !== "not_configured",
      };
    }
    let migrationVersion = String(POSTGRES_SCHEMA_VERSION);
    try {
      const r = await getPostgresPool().query<{ version: number }>(
        "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1"
      );
      if (r.rows[0]?.version != null) migrationVersion = String(r.rows[0].version);
    } catch {
      /* table may not exist yet */
    }
    return {
      status: "healthy",
      responseTimeMs: pg.latencyMs,
      lastCheckedAt: checked,
      message: "PostgreSQL OK",
      configured: true,
      migrationVersion,
    };
  }

  // Local SQLite / memory fallback — do not expose filesystem paths
  const ready = isDatabaseReady();
  return {
    status: ready ? "healthy" : "degraded",
    lastCheckedAt: checked,
    message: ready
      ? `Local persistence (${storageBackend()})`
      : "Using in-memory fallback",
    configured: true,
    migrationVersion: "n/a-local",
  };
}

async function checkObjectStorage(): Promise<ComponentResult> {
  const checked = new Date().toISOString();
  const provider = process.env.STORAGE_PROVIDER?.trim();
  if (!provider && !process.env.S3_ENDPOINT?.trim()) {
    return {
      status: "not_configured",
      lastCheckedAt: checked,
      message: "Object storage not configured",
      configured: false,
    };
  }
  try {
    const { value: health, ms } = await timed(() => getObjectStorage().health());
    return {
      status: health.ok ? "healthy" : "unavailable",
      responseTimeMs: ms,
      lastCheckedAt: checked,
      message: health.ok ? "Object storage OK" : "Object storage unhealthy",
      configured: true,
    };
  } catch {
    return {
      status: "unavailable",
      lastCheckedAt: checked,
      message: "Object storage check failed",
      configured: true,
    };
  }
}

function socketStatus(gps: ComponentResult): ComponentResult {
  const checked = new Date().toISOString();
  if (!isGpsConfigured()) {
    return {
      status: "not_configured",
      lastCheckedAt: checked,
      message: "Socket.IO uses external GPS URL — not configured",
      configured: false,
    };
  }
  // Socket shares GPS backend; probe result mirrors GPS without claiming WS handshake
  if (gps.status === "healthy") {
    return {
      status: "healthy",
      responseTimeMs: gps.responseTimeMs,
      lastCheckedAt: checked,
      message: "GPS Socket.IO endpoint host reachable (HTTP health proxy)",
      configured: true,
    };
  }
  if (gps.status === "not_configured") return { ...gps, message: "Socket.IO not configured" };
  return {
    status: gps.status === "unavailable" ? "unavailable" : "degraded",
    responseTimeMs: gps.responseTimeMs,
    lastCheckedAt: checked,
    message: "Socket.IO host check degraded — full WS handshake REQUIRES client validation",
    configured: true,
  };
}

function overallOf(components: Record<string, ComponentResult>): OverallHealthStatus {
  const statuses = Object.values(components).map((c) => c.status);
  if (statuses.some((s) => s === "unavailable")) {
    // App itself is up if we respond; external unavailability => degraded unless DB down
    if (components.database?.status === "unavailable") return "unavailable";
    return "degraded";
  }
  if (statuses.some((s) => s === "degraded" || s === "unknown")) return "degraded";
  return "healthy";
}

export async function GET() {
  const identity = getReleaseIdentity();
  const checkedAt = new Date().toISOString();

  const [gps, database, objectStorage] = await Promise.all([
    checkGps(),
    checkDatabase(),
    checkObjectStorage(),
  ]);
  const socketIo = socketStatus(gps);

  const application: ComponentResult = {
    status: "healthy",
    lastCheckedAt: checkedAt,
    message: "Application process responding",
    configured: true,
  };

  const components = {
    application,
    database: {
      status: database.status,
      responseTimeMs: database.responseTimeMs,
      lastCheckedAt: database.lastCheckedAt,
      message: database.message,
      configured: database.configured,
    },
    socketIo,
    gpsBackend: gps,
    objectStorage,
  };

  const status = overallOf(components);
  const migrationVersion = database.migrationVersion ?? identity.migrationVersion;

  // Backward-compatible module block for existing UI consumers (safe fields only)
  const legacyStatus = (s: ComponentHealthStatus): "ONLINE" | "OFFLINE" | "DEGRADED" => {
    if (s === "healthy") return "ONLINE";
    if (s === "not_configured" || s === "unknown") return "DEGRADED";
    return "OFFLINE";
  };

  const body = {
    status,
    product: identity.product,
    version: identity.version,
    release: identity.release,
    gitTag: identity.gitTag,
    commitSha: identity.commitSha,
    buildTime: identity.buildTime,
    environment: identity.environment,
    uptimeSeconds: identity.uptimeSeconds,
    migrationVersion,
    deploymentId: identity.deploymentId,
    imageName: identity.imageName,
    imageDigest: identity.imageDigest,
    serverTime: checkedAt,
    components,
    // Safe public host hints (no credentials)
    integrations: {
      gpsHost: stripCredentials(gpsApiUrl()),
      socketHost: stripCredentials(socketUrl()),
    },
    timestamp: checkedAt,
    // Legacy shape (Phase 1 UI) — no filesystem paths or secrets
    overall: status === "healthy" ? "ONLINE" : status === "unavailable" ? "OFFLINE" : "DEGRADED",
    checkedAt,
    modules: {
      backendApi: {
        status: legacyStatus(gps.status),
        detail: gps.message,
        configured: gps.configured,
      },
      socket: {
        status: legacyStatus(socketIo.status),
        detail: socketIo.message,
        configured: socketIo.configured,
      },
      database: {
        status: legacyStatus(database.status),
        backend: isPostgresConfigured() ? "postgres" : storageBackend(),
        detail: database.message,
        configured: database.configured,
      },
      geoUpload: {
        status: "ONLINE" as const,
        detail: "GeoJSON validation & storage module loaded",
        configured: true,
      },
      objectStorage: {
        status: legacyStatus(objectStorage.status),
        detail: objectStorage.message,
        configured: objectStorage.configured,
      },
    },
  };

  const httpStatus = status === "unavailable" ? 503 : 200;
  return NextResponse.json(body, { status: httpStatus });
}
