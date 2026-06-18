import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db/sqlite";
import type { GeoUploadRecord } from "@/types/geo";
import type { CreatePermitInput, PermitMaster, UpdatePermitInput } from "@/types/permit";
import type { CreateVehicleInput, UpdateVehicleInput, VehicleMaster } from "@/types/vehicle";
import type { GeoRepository, PermitRepository, VehicleRepository } from "./types";

function rowToVehicle(row: Record<string, unknown>): VehicleMaster {
  return {
    id: String(row.id),
    imei: String(row.imei),
    plateNumber: String(row.plate_number),
    vehicleName: String(row.vehicle_name),
    vehicleType: row.vehicle_type as VehicleMaster["vehicleType"],
    companyName: String(row.company_name),
    driverName: String(row.driver_name),
    driverMobile: String(row.driver_mobile ?? ""),
    simNumber: String(row.sim_number ?? ""),
    permitNumber: String(row.permit_number),
    installationDate: String(row.installation_date),
    status: row.status as VehicleMaster["status"],
    notes: String(row.notes ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function rowToPermit(row: Record<string, unknown>): PermitMaster {
  return {
    id: String(row.id),
    permitNumber: String(row.permit_number),
    projectName: String(row.project_name),
    companyName: String(row.company_name),
    contactPerson: String(row.contact_person),
    contactNumber: String(row.contact_number ?? ""),
    startDate: String(row.start_date),
    endDate: String(row.end_date),
    status: row.status as PermitMaster["status"],
    approvedAreaName: String(row.approved_area_name ?? ""),
    assignedVehicleIds: JSON.parse(String(row.assigned_vehicle_ids || "[]")) as string[],
    comments: String(row.comments ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function rowToGeo(row: Record<string, unknown>): GeoUploadRecord {
  return {
    id: String(row.id),
    permitId: String(row.permit_id),
    permitNumber: String(row.permit_number),
    type: row.type as GeoUploadRecord["type"],
    name: String(row.name),
    fileName: String(row.file_name),
    geometry: JSON.parse(String(row.geometry_json)) as GeoJSON.Geometry,
    featureCollection: JSON.parse(String(row.feature_collection_json)) as GeoJSON.FeatureCollection,
    uploadedAt: String(row.uploaded_at),
    uploadedBy: String(row.uploaded_by),
    metadata: JSON.parse(String(row.metadata_json)),
  };
}

class SqliteVehicleRepository implements VehicleRepository {
  async findAll() {
    const rows = getDb().prepare("SELECT * FROM vehicles ORDER BY vehicle_name").all();
    return rows.map((r) => rowToVehicle(r as Record<string, unknown>));
  }

  async findById(id: string) {
    const row = getDb().prepare("SELECT * FROM vehicles WHERE id = ?").get(id);
    return row ? rowToVehicle(row as Record<string, unknown>) : null;
  }

  async findByImei(imei: string) {
    const row = getDb().prepare("SELECT * FROM vehicles WHERE imei = ?").get(imei);
    return row ? rowToVehicle(row as Record<string, unknown>) : null;
  }

  async create(input: CreateVehicleInput) {
    const ts = new Date().toISOString();
    const vehicle: VehicleMaster = {
      id: `vh-${uuidv4().slice(0, 8)}`,
      imei: input.imei.trim(),
      plateNumber: input.plateNumber.trim(),
      vehicleName: input.vehicleName.trim(),
      vehicleType: input.vehicleType,
      companyName: input.companyName.trim(),
      driverName: input.driverName.trim(),
      driverMobile: input.driverMobile?.trim() ?? "",
      simNumber: input.simNumber?.trim() ?? "",
      permitNumber: input.permitNumber.trim(),
      installationDate: input.installationDate ?? ts.slice(0, 10),
      status: input.status ?? "Active",
      notes: input.notes?.trim() ?? "",
      createdAt: ts,
      updatedAt: ts,
    };
    getDb()
      .prepare(
        `INSERT INTO vehicles (id, imei, plate_number, vehicle_name, vehicle_type, company_name,
        driver_name, driver_mobile, sim_number, permit_number, installation_date, status, notes, created_at, updated_at)
        VALUES (@id, @imei, @plateNumber, @vehicleName, @vehicleType, @companyName,
        @driverName, @driverMobile, @simNumber, @permitNumber, @installationDate, @status, @notes, @createdAt, @updatedAt)`
      )
      .run({
        id: vehicle.id,
        imei: vehicle.imei,
        plateNumber: vehicle.plateNumber,
        vehicleName: vehicle.vehicleName,
        vehicleType: vehicle.vehicleType,
        companyName: vehicle.companyName,
        driverName: vehicle.driverName,
        driverMobile: vehicle.driverMobile,
        simNumber: vehicle.simNumber,
        permitNumber: vehicle.permitNumber,
        installationDate: vehicle.installationDate,
        status: vehicle.status,
        notes: vehicle.notes,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      });
    return vehicle;
  }

  async update(id: string, input: UpdateVehicleInput) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
    getDb()
      .prepare(
        `UPDATE vehicles SET imei=@imei, plate_number=@plateNumber, vehicle_name=@vehicleName,
        vehicle_type=@vehicleType, company_name=@companyName, driver_name=@driverName,
        driver_mobile=@driverMobile, sim_number=@simNumber, permit_number=@permitNumber,
        installation_date=@installationDate, status=@status, notes=@notes, updated_at=@updatedAt WHERE id=@id`
      )
      .run({
        id,
        imei: updated.imei,
        plateNumber: updated.plateNumber,
        vehicleName: updated.vehicleName,
        vehicleType: updated.vehicleType,
        companyName: updated.companyName,
        driverName: updated.driverName,
        driverMobile: updated.driverMobile,
        simNumber: updated.simNumber,
        permitNumber: updated.permitNumber,
        installationDate: updated.installationDate,
        status: updated.status,
        notes: updated.notes,
        updatedAt: updated.updatedAt,
      });
    return updated;
  }

  async delete(id: string) {
    const result = getDb().prepare("DELETE FROM vehicles WHERE id = ?").run(id);
    return result.changes > 0;
  }
}

class SqlitePermitRepository implements PermitRepository {
  async findAll() {
    const rows = getDb().prepare("SELECT * FROM permits ORDER BY permit_number").all();
    return rows.map((r) => rowToPermit(r as Record<string, unknown>));
  }

  async findById(id: string) {
    const row = getDb().prepare("SELECT * FROM permits WHERE id = ?").get(id);
    return row ? rowToPermit(row as Record<string, unknown>) : null;
  }

  async create(input: CreatePermitInput) {
    const ts = new Date().toISOString();
    const permit: PermitMaster = {
      id: `prm-${uuidv4().slice(0, 8)}`,
      permitNumber: input.permitNumber.trim(),
      projectName: input.projectName.trim(),
      companyName: input.companyName.trim(),
      contactPerson: input.contactPerson.trim(),
      contactNumber: input.contactNumber?.trim() ?? "",
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status ?? "Ongoing",
      approvedAreaName: input.approvedAreaName?.trim() ?? "",
      assignedVehicleIds: input.assignedVehicleIds ?? [],
      comments: input.comments?.trim() ?? "",
      createdAt: ts,
      updatedAt: ts,
    };
    getDb()
      .prepare(
        `INSERT INTO permits (id, permit_number, project_name, company_name, contact_person, contact_number,
        start_date, end_date, status, approved_area_name, assigned_vehicle_ids, comments, created_at, updated_at)
        VALUES (@id, @permitNumber, @projectName, @companyName, @contactPerson, @contactNumber,
        @startDate, @endDate, @status, @approvedAreaName, @assignedVehicleIds, @comments, @createdAt, @updatedAt)`
      )
      .run({
        id: permit.id,
        permitNumber: permit.permitNumber,
        projectName: permit.projectName,
        companyName: permit.companyName,
        contactPerson: permit.contactPerson,
        contactNumber: permit.contactNumber,
        startDate: permit.startDate,
        endDate: permit.endDate,
        status: permit.status,
        approvedAreaName: permit.approvedAreaName,
        assignedVehicleIds: JSON.stringify(permit.assignedVehicleIds),
        comments: permit.comments,
        createdAt: permit.createdAt,
        updatedAt: permit.updatedAt,
      });
    return permit;
  }

  async update(id: string, input: UpdatePermitInput) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...input,
      assignedVehicleIds: input.assignedVehicleIds ?? existing.assignedVehicleIds,
      updatedAt: new Date().toISOString(),
    };
    getDb()
      .prepare(
        `UPDATE permits SET permit_number=@permitNumber, project_name=@projectName, company_name=@companyName,
        contact_person=@contactPerson, contact_number=@contactNumber, start_date=@startDate, end_date=@endDate,
        status=@status, approved_area_name=@approvedAreaName, assigned_vehicle_ids=@assignedVehicleIds,
        comments=@comments, updated_at=@updatedAt WHERE id=@id`
      )
      .run({
        id,
        permitNumber: updated.permitNumber,
        projectName: updated.projectName,
        companyName: updated.companyName,
        contactPerson: updated.contactPerson,
        contactNumber: updated.contactNumber,
        startDate: updated.startDate,
        endDate: updated.endDate,
        status: updated.status,
        approvedAreaName: updated.approvedAreaName,
        assignedVehicleIds: JSON.stringify(updated.assignedVehicleIds),
        comments: updated.comments,
        updatedAt: updated.updatedAt,
      });
    return updated;
  }

  async delete(id: string) {
    const result = getDb().prepare("DELETE FROM permits WHERE id = ?").run(id);
    return result.changes > 0;
  }
}

class SqliteGeoRepository implements GeoRepository {
  async findAll() {
    const rows = getDb().prepare("SELECT * FROM geo_uploads ORDER BY uploaded_at DESC").all();
    return rows.map((r) => rowToGeo(r as Record<string, unknown>));
  }

  async findByPermitId(permitId: string) {
    const rows = getDb().prepare("SELECT * FROM geo_uploads WHERE permit_id = ?").all(permitId);
    return rows.map((r) => rowToGeo(r as Record<string, unknown>));
  }

  async create(record: Omit<GeoUploadRecord, "id" | "uploadedAt">) {
    const upload: GeoUploadRecord = {
      ...record,
      id: `geo-${uuidv4().slice(0, 8)}`,
      uploadedAt: new Date().toISOString(),
    };
    getDb()
      .prepare(
        `INSERT INTO geo_uploads (id, permit_id, permit_number, type, name, file_name,
        geometry_json, feature_collection_json, uploaded_at, uploaded_by, metadata_json)
        VALUES (@id, @permitId, @permitNumber, @type, @name, @fileName,
        @geometryJson, @featureCollectionJson, @uploadedAt, @uploadedBy, @metadataJson)`
      )
      .run({
        id: upload.id,
        permitId: upload.permitId,
        permitNumber: upload.permitNumber,
        type: upload.type,
        name: upload.name,
        fileName: upload.fileName,
        geometryJson: JSON.stringify(upload.geometry),
        featureCollectionJson: JSON.stringify(upload.featureCollection),
        uploadedAt: upload.uploadedAt,
        uploadedBy: upload.uploadedBy,
        metadataJson: JSON.stringify(upload.metadata),
      });
    return upload;
  }

  async delete(id: string) {
    const result = getDb().prepare("DELETE FROM geo_uploads WHERE id = ?").run(id);
    return result.changes > 0;
  }
}

const vehicleRepo = new SqliteVehicleRepository();
const permitRepo = new SqlitePermitRepository();
const geoRepo = new SqliteGeoRepository();

export function getVehicleRepository(): VehicleRepository {
  return vehicleRepo;
}

export function getPermitRepository(): PermitRepository {
  return permitRepo;
}

export function getGeoRepository(): GeoRepository {
  return geoRepo;
}
