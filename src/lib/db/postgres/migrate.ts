/**
 * Apply PostgreSQL migrations.
 */

import { getPostgresPool, isPostgresConfigured } from "./pool";
import { POSTGRES_MIGRATION_001, POSTGRES_SCHEMA_VERSION, ROLE_SEED } from "./schema";
import { PERMISSIONS, ROLE_PERMISSION_MAP } from "@/lib/auth/permissions";

export async function migratePostgres(): Promise<{ version: number; applied: boolean }> {
  if (!isPostgresConfigured()) {
    throw new Error("Cannot migrate: DATABASE_URL not configured");
  }
  const pool = getPostgresPool();
  await pool.query(POSTGRES_MIGRATION_001);

  const existing = await pool.query<{ version: number }>(
    "SELECT version FROM schema_migrations WHERE version = $1",
    [POSTGRES_SCHEMA_VERSION]
  );
  if (existing.rowCount && existing.rowCount > 0) {
    return { version: POSTGRES_SCHEMA_VERSION, applied: false };
  }

  // Seed roles
  for (const role of ROLE_SEED) {
    await pool.query(
      `INSERT INTO roles (id, code, name) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
      [role.id, role.code, role.name]
    );
  }

  // Seed permissions
  for (const code of Object.values(PERMISSIONS)) {
    await pool.query(
      `INSERT INTO permissions (id, code, description) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
      [`perm-${code}`, code, code]
    );
  }

  // Seed role_permissions
  for (const [roleCode, perms] of Object.entries(ROLE_PERMISSION_MAP)) {
    const role = await pool.query<{ id: string }>(`SELECT id FROM roles WHERE code = $1`, [roleCode]);
    const roleId = role.rows[0]?.id;
    if (!roleId) continue;
    for (const perm of perms) {
      const p = await pool.query<{ id: string }>(`SELECT id FROM permissions WHERE code = $1`, [perm]);
      const permId = p.rows[0]?.id;
      if (!permId) continue;
      await pool.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [roleId, permId]
      );
    }
  }

  // Default tenant
  await pool.query(
    `INSERT INTO tenants (id, name, code, status, created_by)
     VALUES ('dubai-giscd', 'Dubai GISCD', 'DUBAI-GISCD', 'ACTIVE', 'system')
     ON CONFLICT (id) DO NOTHING`
  );

  await pool.query(
    `INSERT INTO schema_migrations (version, name) VALUES ($1, $2)`,
    [POSTGRES_SCHEMA_VERSION, "001_core_schema"]
  );

  return { version: POSTGRES_SCHEMA_VERSION, applied: true };
}
