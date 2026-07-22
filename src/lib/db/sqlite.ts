import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { isDevelopment } from "@/lib/config";
import { SEED_PERMITS, SEED_VEHICLES } from "@/lib/repositories/seed-data";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.SQLITE_PATH || path.join(DATA_DIR, "giscd.db");

let db: Database.Database | null = null;

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    imei TEXT UNIQUE NOT NULL,
    plate_number TEXT NOT NULL,
    vehicle_name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    company_name TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    driver_mobile TEXT DEFAULT '',
    sim_number TEXT DEFAULT '',
    permit_number TEXT NOT NULL,
    installation_date TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS permits (
    id TEXT PRIMARY KEY,
    permit_number TEXT UNIQUE NOT NULL,
    project_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    contact_number TEXT DEFAULT '',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL,
    approved_area_name TEXT DEFAULT '',
    assigned_vehicle_ids TEXT DEFAULT '[]',
    comments TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS geo_uploads (
    id TEXT PRIMARY KEY,
    permit_id TEXT NOT NULL,
    permit_number TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    geometry_json TEXT NOT NULL,
    feature_collection_json TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    metadata_json TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_vehicles_imei ON vehicles(imei);
  CREATE INDEX IF NOT EXISTS idx_permits_number ON permits(permit_number);
  CREATE INDEX IF NOT EXISTS idx_geo_permit ON geo_uploads(permit_id);

  CREATE TABLE IF NOT EXISTS survey_assignments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    driver_id TEXT,
    route_id TEXT NOT NULL,
    route_name TEXT NOT NULL,
    permit_id TEXT,
    survey_type TEXT NOT NULL,
    priority TEXT NOT NULL,
    planned_start INTEGER,
    planned_end INTEGER,
    actual_start INTEGER,
    actual_end INTEGER,
    status TEXT NOT NULL,
    created_by TEXT NOT NULL,
    approved_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    geometry_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS survey_decisions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    payload_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS survey_alerts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    severity TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    status TEXT NOT NULL,
    acknowledged_by TEXT,
    acknowledged_at INTEGER,
    payload_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS survey_blockages (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    photo_ids_json TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS survey_photos (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    assignment_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    blockage_id TEXT,
    filename TEXT NOT NULL,
    stored_path TEXT NOT NULL,
    size INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    latitude REAL,
    longitude REAL
  );

  CREATE TABLE IF NOT EXISTS survey_notifications (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    vehicle_id TEXT,
    assignment_id TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    severity TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    acknowledged INTEGER NOT NULL DEFAULT 0,
    payload_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS survey_audit (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    assignment_id TEXT,
    vehicle_id TEXT,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    payload_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS survey_progress (
    assignment_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    completion_pct REAL NOT NULL,
    completed_segment_ids_json TEXT NOT NULL,
    route_state TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_survey_asg_vehicle ON survey_assignments(vehicle_id);
  CREATE INDEX IF NOT EXISTS idx_survey_asg_tenant ON survey_assignments(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_survey_asg_status ON survey_assignments(status);
  CREATE INDEX IF NOT EXISTS idx_survey_dec_vehicle ON survey_decisions(vehicle_id);
  CREATE INDEX IF NOT EXISTS idx_survey_alert_status ON survey_alerts(status);
  CREATE INDEX IF NOT EXISTS idx_survey_audit_asg ON survey_audit(assignment_id);
`;

function seedIfEmpty(database: Database.Database) {
  if (!isDevelopment()) return;

  const count = database.prepare("SELECT COUNT(*) as c FROM vehicles").get() as { c: number };
  if (count.c > 0) return;

  const insertVehicle = database.prepare(`
    INSERT INTO vehicles (id, imei, plate_number, vehicle_name, vehicle_type, company_name,
      driver_name, driver_mobile, sim_number, permit_number, installation_date, status, notes, created_at, updated_at)
    VALUES (@id, @imei, @plateNumber, @vehicleName, @vehicleType, @companyName,
      @driverName, @driverMobile, @simNumber, @permitNumber, @installationDate, @status, @notes, @createdAt, @updatedAt)
  `);

  const insertPermit = database.prepare(`
    INSERT INTO permits (id, permit_number, project_name, company_name, contact_person, contact_number,
      start_date, end_date, status, approved_area_name, assigned_vehicle_ids, comments, created_at, updated_at)
    VALUES (@id, @permitNumber, @projectName, @companyName, @contactPerson, @contactNumber,
      @startDate, @endDate, @status, @approvedAreaName, @assignedVehicleIds, @comments, @createdAt, @updatedAt)
  `);

  const tx = database.transaction(() => {
    for (const v of SEED_VEHICLES) {
      insertVehicle.run({
        id: v.id,
        imei: v.imei,
        plateNumber: v.plateNumber,
        vehicleName: v.vehicleName,
        vehicleType: v.vehicleType,
        companyName: v.companyName,
        driverName: v.driverName,
        driverMobile: v.driverMobile,
        simNumber: v.simNumber,
        permitNumber: v.permitNumber,
        installationDate: v.installationDate,
        status: v.status,
        notes: v.notes,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      });
    }
    for (const p of SEED_PERMITS) {
      insertPermit.run({
        id: p.id,
        permitNumber: p.permitNumber,
        projectName: p.projectName,
        companyName: p.companyName,
        contactPerson: p.contactPerson,
        contactNumber: p.contactNumber,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status,
        approvedAreaName: p.approvedAreaName,
        assignedVehicleIds: JSON.stringify(p.assignedVehicleIds),
        comments: p.comments,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      });
    }
  });
  tx();
}

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 3000");
  db.pragma("synchronous = NORMAL");
  db.exec(SCHEMA_SQL);
  seedIfEmpty(db);
  return db;
}

export function getDbPath(): string {
  return DB_PATH;
}

export function isDatabaseReady(): boolean {
  try {
    getDb();
    return true;
  } catch {
    return false;
  }
}
