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
