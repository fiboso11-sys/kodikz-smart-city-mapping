/**
 * Database backend selector — SQLite only for explicit local development.
 */

import { getAppConfig, ConfigError } from "@/lib/config/app-config";
import { isDatabaseReady } from "@/lib/db/sqlite";
import { isPostgresConfigured } from "@/lib/db/postgres/pool";

export type DbBackend = "postgres" | "sqlite" | "memory";

export function resolveDbBackend(): DbBackend {
  let mode: "local" | "pilot" | "municipality" = "local";
  try {
    mode = getAppConfig().deploymentMode;
  } catch (err) {
    if (err instanceof ConfigError) throw err;
  }

  if (mode === "pilot" || mode === "municipality") {
    if (!isPostgresConfigured()) {
      throw new ConfigError(
        `[${mode}] PostgreSQL required. Refusing silent SQLite fallback.`
      );
    }
    return "postgres";
  }

  // local
  if (isPostgresConfigured() && process.env.FORCE_POSTGRES === "true") return "postgres";
  if (isDatabaseReady()) return "sqlite";
  return "memory";
}

export function assertNoSilentSqliteInProduction(): void {
  const backend = resolveDbBackend();
  const mode = getAppConfig().deploymentMode;
  if ((mode === "pilot" || mode === "municipality") && backend !== "postgres") {
    throw new ConfigError("Production modes must use PostgreSQL.");
  }
}
