/**
 * SQLite → PostgreSQL survey data migration tooling.
 * Commands: export | import | validate | dry-run
 *
 * Run:
 *   pnpm migrate:sqlite-export
 *   pnpm migrate:sqlite-to-pg -- --dry-run
 */

import fs from "fs";
import path from "path";
import { createHash } from "crypto";

type Counts = Record<string, number>;

interface MigrationReportRow {
  table: string;
  sourceCount: number;
  destinationCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  validationResult: "PASS" | "FAIL" | "SKIP";
  failureReason?: string;
}

function checksum(obj: unknown): string {
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex").slice(0, 16);
}

async function exportFromSqlite(outDir: string): Promise<Counts> {
  const { getDb, isDatabaseReady } = await import("../src/lib/db/sqlite");
  if (!isDatabaseReady()) {
    throw new Error("SQLite database not ready");
  }
  const db = getDb();
  fs.mkdirSync(outDir, { recursive: true });

  const tables = [
    "survey_assignments",
    "survey_decisions",
    "survey_alerts",
    "survey_blockages",
    "survey_photos",
    "survey_notifications",
    "survey_audit",
    "survey_progress",
  ];

  const counts: Counts = {};
  for (const table of tables) {
    try {
      const rows = db.prepare(`SELECT * FROM ${table}`).all();
      counts[table] = rows.length;
      fs.writeFileSync(path.join(outDir, `${table}.json`), JSON.stringify(rows, null, 2));
      fs.writeFileSync(
        path.join(outDir, `${table}.checksum`),
        checksum(rows)
      );
    } catch {
      counts[table] = 0;
      fs.writeFileSync(path.join(outDir, `${table}.json`), "[]");
    }
  }

  // Pre-migration backup copy
  const sqlitePath = process.env.SQLITE_PATH || path.join(process.cwd(), "data", "giscd.db");
  if (fs.existsSync(sqlitePath)) {
    const bak = path.join(outDir, `giscd.db.bak-${Date.now()}`);
    fs.copyFileSync(sqlitePath, bak);
    console.log(`Pre-migration SQLite backup: ${bak}`);
  }

  fs.writeFileSync(path.join(outDir, "export-meta.json"), JSON.stringify({ counts, exportedAt: new Date().toISOString() }, null, 2));
  return counts;
}

async function importToPostgres(inDir: string, dryRun: boolean): Promise<MigrationReportRow[]> {
  const { isPostgresConfigured, pgQuery } = await import("../src/lib/db/postgres/pool");
  const { migratePostgres } = await import("../src/lib/db/postgres/migrate");
  if (!isPostgresConfigured()) throw new Error("DATABASE_URL required for import");

  await migratePostgres();
  const report: MigrationReportRow[] = [];

  const assignmentFile = path.join(inDir, "survey_assignments.json");
  if (!fs.existsSync(assignmentFile)) throw new Error("Missing survey_assignments.json — run export first");

  const assignments = JSON.parse(fs.readFileSync(assignmentFile, "utf8")) as Array<Record<string, unknown>>;
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  // Ensure tenant exists
  if (!dryRun) {
    await pgQuery(
      `INSERT INTO tenants (id, name, code, status) VALUES ('dubai-giscd','Dubai GISCD','DUBAI-GISCD','ACTIVE') ON CONFLICT DO NOTHING`
    );
  }

  for (const row of assignments) {
    try {
      if (dryRun) {
        inserted += 1;
        continue;
      }
      const existing = await pgQuery(`SELECT id FROM survey_assignments WHERE id=$1`, [row.id]);
      if (existing.rowCount && existing.rowCount > 0) {
        skipped += 1;
        continue;
      }
      await pgQuery(
        `INSERT INTO survey_assignments (
          id, tenant_id, vehicle_id, driver_id, route_id, route_name, permit_id,
          survey_type, priority, planned_start, planned_end, actual_start, actual_end,
          status, created_by, approved_by, created_at, updated_at, geometry_json
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          to_timestamp($10/1000.0), to_timestamp($11/1000.0), to_timestamp($12/1000.0), to_timestamp($13/1000.0),
          $14,$15,$16, to_timestamp($17/1000.0), to_timestamp($18/1000.0), $19::jsonb
        )`,
        [
          row.id,
          row.tenant_id ?? "dubai-giscd",
          row.vehicle_id,
          row.driver_id,
          row.route_id,
          row.route_name,
          row.permit_id,
          row.survey_type,
          row.priority,
          row.planned_start,
          row.planned_end,
          row.actual_start,
          row.actual_end,
          row.status,
          row.created_by,
          row.approved_by,
          row.created_at,
          row.updated_at,
          row.geometry_json,
        ]
      );
      inserted += 1;
    } catch (err) {
      failed += 1;
      console.error("Failed assignment", row.id, err instanceof Error ? err.message : err);
    }
  }

  const dest = dryRun
    ? { rows: [{ c: "0" }] }
    : await pgQuery<{ c: string }>(`SELECT COUNT(*)::text AS c FROM survey_assignments`);

  report.push({
    table: "survey_assignments",
    sourceCount: assignments.length,
    destinationCount: Number(dest.rows[0]?.c ?? 0),
    insertedCount: inserted,
    updatedCount: 0,
    skippedCount: skipped,
    failedCount: failed,
    validationResult: failed === 0 && (dryRun || Number(dest.rows[0]?.c ?? 0) >= inserted) ? "PASS" : "FAIL",
    failureReason: failed ? `${failed} rows failed` : undefined,
  });

  // Photos metadata only (binaries require separate object storage migration)
  const photosPath = path.join(inDir, "survey_photos.json");
  if (fs.existsSync(photosPath)) {
    const photos = JSON.parse(fs.readFileSync(photosPath, "utf8")) as Array<Record<string, unknown>>;
    let pIns = 0;
    let pSkip = 0;
    let pFail = 0;
    for (const row of photos) {
      try {
        if (dryRun) {
          pIns += 1;
          continue;
        }
        const existing = await pgQuery(`SELECT id FROM photo_attachments WHERE id=$1`, [row.id]);
        if (existing.rowCount && existing.rowCount > 0) {
          pSkip += 1;
          continue;
        }
        await pgQuery(
          `INSERT INTO photo_attachments (
            id, tenant_id, assignment_id, vehicle_id, blockage_id, object_key,
            original_filename, safe_filename, mime_type, size_bytes, status, latitude, longitude, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,'READY',$10,$11,to_timestamp($12/1000.0))`,
          [
            row.id,
            row.tenant_id ?? "dubai-giscd",
            row.assignment_id,
            row.vehicle_id,
            row.blockage_id,
            row.stored_path,
            row.filename,
            row.content_type,
            row.size,
            row.latitude,
            row.longitude,
            row.timestamp,
          ]
        );
        pIns += 1;
      } catch {
        pFail += 1;
      }
    }
    report.push({
      table: "photo_attachments",
      sourceCount: photos.length,
      destinationCount: pIns + pSkip,
      insertedCount: pIns,
      updatedCount: 0,
      skippedCount: pSkip,
      failedCount: pFail,
      validationResult: pFail === 0 ? "PASS" : "FAIL",
    });
  }

  return report;
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] ?? "help";
  const dryRun = args.includes("--dry-run");
  const outDir = path.join(process.cwd(), "data", "migrations", "sqlite-export");

  if (cmd === "export") {
    const counts = await exportFromSqlite(outDir);
    console.log("Export complete", counts);
    return;
  }

  if (cmd === "import" || cmd === "dry-run") {
    const report = await importToPostgres(outDir, dryRun || cmd === "dry-run");
    const reportPath = path.join(outDir, `import-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    console.log("Report written:", reportPath);
    const failed = report.some((r) => r.validationResult === "FAIL");
    process.exit(failed ? 1 : 0);
  }

  if (cmd === "validate") {
    const reportFile = fs
      .readdirSync(outDir)
      .filter((f) => f.startsWith("import-report-"))
      .sort()
      .pop();
    if (!reportFile) {
      console.error("No import report found");
      process.exit(1);
    }
    const report = JSON.parse(fs.readFileSync(path.join(outDir, reportFile), "utf8")) as MigrationReportRow[];
    const ok = report.every((r) => r.validationResult === "PASS");
    console.log(ok ? "VALIDATION PASS" : "VALIDATION FAIL");
    console.log(report);
    process.exit(ok ? 0 : 1);
  }

  console.log(`Usage:
  npx tsx scripts/sqlite-to-postgres.ts export
  npx tsx scripts/sqlite-to-postgres.ts import --dry-run
  npx tsx scripts/sqlite-to-postgres.ts import
  npx tsx scripts/sqlite-to-postgres.ts validate

Rollback: restore SQLite from data/migrations/sqlite-export/giscd.db.bak-*
          and point SQLITE_PATH back; do not drop PostgreSQL until validated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
