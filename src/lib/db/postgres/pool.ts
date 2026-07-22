/**
 * PostgreSQL connection pool — fails clearly when required and missing.
 */

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { getAppConfig, ConfigError } from "@/lib/config/app-config";

let pool: Pool | null = null;

export function isPostgresConfigured(): boolean {
  try {
    return Boolean(getAppConfig().database.url);
  } catch {
    return Boolean(process.env.DATABASE_URL?.trim());
  }
}

export function getPostgresPool(): Pool {
  if (pool) return pool;
  const cfg = getAppConfig();
  if (!cfg.database.url) {
    throw new ConfigError("DATABASE_URL is not configured.");
  }
  pool = new Pool({
    connectionString: cfg.database.url,
    ssl: cfg.database.ssl ? { rejectUnauthorized: false } : undefined,
    max: cfg.database.poolMax,
  });
  pool.on("error", (err) => {
    console.error("[postgres] pool error", err.message);
  });
  return pool;
}

export async function pgQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return getPostgresPool().query<T>(text, params);
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPostgresPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function postgresHealthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  if (!isPostgresConfigured()) {
    return { ok: false, latencyMs: 0, error: "not_configured" };
  }
  const t0 = Date.now();
  try {
    await getPostgresPool().query("SELECT 1");
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : "query_failed",
    };
  }
}
