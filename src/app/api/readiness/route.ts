import { NextResponse } from "next/server";
import { getAppConfig, ConfigError } from "@/lib/config/app-config";
import { postgresHealthCheck, isPostgresConfigured } from "@/lib/db/postgres/pool";
import { getObjectStorage } from "@/lib/storage/object-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Readiness — fails if pilot/municipality required dependencies are down.
 */
export async function GET() {
  try {
    const cfg = getAppConfig();
    const readyChecks: Record<string, { ok: boolean; error?: string }> = {};

    if (cfg.deploymentMode === "local") {
      readyChecks.config = { ok: true };
      readyChecks.database = { ok: true, error: "sqlite_or_memory_allowed" };
    } else {
      if (!isPostgresConfigured()) {
        return NextResponse.json(
          { ready: false, error: "DATABASE_URL required" },
          { status: 503 }
        );
      }
      const pg = await postgresHealthCheck();
      readyChecks.postgres = pg;
      const storage = await getObjectStorage().health();
      readyChecks.objectStorage = storage;
      if (!pg.ok || !storage.ok) {
        return NextResponse.json({ ready: false, checks: readyChecks }, { status: 503 });
      }
    }

    return NextResponse.json({
      ready: true,
      deploymentMode: cfg.deploymentMode,
      checks: readyChecks,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof ConfigError ? err.message : "not_ready";
    return NextResponse.json({ ready: false, error: message }, { status: 503 });
  }
}
