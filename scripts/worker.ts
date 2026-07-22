/**
 * Background worker — outbox publisher and maintenance jobs.
 * Run: pnpm worker
 */

import { loadAppConfig } from "@/lib/config/app-config";
import { processOutboxBatch, outboxPendingCount } from "@/services/survey/outbox";
import { migratePostgres } from "@/lib/db/postgres/migrate";
import { isPostgresConfigured, closePostgresPool } from "@/lib/db/postgres/pool";
import { log } from "@/lib/observability/logger";

async function tick() {
  const outbox = await processOutboxBatch(50);
  const pending = await outboxPendingCount();
  if (outbox.published || outbox.failed || pending > 0) {
    log("info", "worker_tick", { ...outbox, pending });
  }
}

async function main() {
  const cfg = loadAppConfig();
  log("info", "worker_start", { mode: cfg.deploymentMode, pollMs: cfg.worker.pollIntervalMs });

  if (isPostgresConfigured()) {
    const mig = await migratePostgres();
    log("info", "worker_migrate", mig);
  }

  const interval = setInterval(() => {
    void tick().catch((err) =>
      log("error", "worker_tick_failed", { error: err instanceof Error ? err.message : "error" })
    );
  }, cfg.worker.pollIntervalMs);

  const shutdown = async () => {
    clearInterval(interval);
    await closePostgresPool();
    log("info", "worker_shutdown", {});
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  await tick();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
