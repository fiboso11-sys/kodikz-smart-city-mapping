import { NextResponse } from "next/server";
import { postgresHealthCheck, isPostgresConfigured } from "@/lib/db/postgres/pool";
import { getObjectStorage } from "@/lib/storage/object-storage";
import { getAuthProvider } from "@/lib/auth/provider";
import { getSurveyRealtimeAdapter } from "@/services/survey/realtime-adapter";
import { outboxPendingCount } from "@/services/survey/outbox";
import { resolveDeploymentMode } from "@/lib/config/app-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const mode = (() => {
    try {
      return resolveDeploymentMode();
    } catch {
      return "unknown";
    }
  })();

  const [pg, storage, authOk, realtime, outbox] = await Promise.all([
    postgresHealthCheck(),
    getObjectStorage().health(),
    getAuthProvider().health(),
    getSurveyRealtimeAdapter().health(),
    outboxPendingCount().catch(() => -1),
  ]);

  const body = {
    status: "ok",
    deploymentMode: mode,
    timestamp: new Date().toISOString(),
    checks: {
      postgres: isPostgresConfigured() ? pg : { ok: mode === "local", latencyMs: 0, note: "not_required_in_local" },
      objectStorage: storage,
      auth: { ok: authOk },
      surveyRealtime: realtime,
      outboxPending: outbox,
      gpsBackend: "external",
    },
  };

  return NextResponse.json(body);
}
