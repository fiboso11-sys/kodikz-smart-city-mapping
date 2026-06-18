import { v4 as uuidv4 } from "uuid";
import { isDevelopment } from "@/lib/config";
import type { GeoUploadRecord } from "@/types/geo";
import type { CreatePermitInput, PermitMaster, UpdatePermitInput } from "@/types/permit";
import type { CreateVehicleInput, UpdateVehicleInput, VehicleMaster } from "@/types/vehicle";
import type { GeoRepository, PermitRepository, VehicleRepository } from "./types";
import { SEED_PERMITS, SEED_VEHICLES } from "./seed-data";

const initialVehicles = () => (isDevelopment() ? [...SEED_VEHICLES] : []);
const initialPermits = () => (isDevelopment() ? [...SEED_PERMITS] : []);

class MockVehicleRepository implements VehicleRepository {
  private vehicles: VehicleMaster[] = initialVehicles();

  async findAll() {
    return [...this.vehicles];
  }

  async findById(id: string) {
    return this.vehicles.find((v) => v.id === id) ?? null;
  }

  async findByImei(imei: string) {
    return this.vehicles.find((v) => v.imei === imei) ?? null;
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
    this.vehicles.push(vehicle);
    return vehicle;
  }

  async update(id: string, input: UpdateVehicleInput) {
    const idx = this.vehicles.findIndex((v) => v.id === id);
    if (idx < 0) return null;
    this.vehicles[idx] = {
      ...this.vehicles[idx],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    return this.vehicles[idx];
  }

  async delete(id: string) {
    const before = this.vehicles.length;
    this.vehicles = this.vehicles.filter((v) => v.id !== id);
    return this.vehicles.length < before;
  }
}

class MockPermitRepository implements PermitRepository {
  private permits: PermitMaster[] = initialPermits();

  async findAll() {
    return [...this.permits];
  }

  async findById(id: string) {
    return this.permits.find((p) => p.id === id) ?? null;
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
    this.permits.push(permit);
    return permit;
  }

  async update(id: string, input: UpdatePermitInput) {
    const idx = this.permits.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    this.permits[idx] = {
      ...this.permits[idx],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    return this.permits[idx];
  }

  async delete(id: string) {
    const before = this.permits.length;
    this.permits = this.permits.filter((p) => p.id !== id);
    return this.permits.length < before;
  }
}

class MockGeoRepository implements GeoRepository {
  private uploads: GeoUploadRecord[] = [];

  async findAll() {
    return [...this.uploads];
  }

  async findByPermitId(permitId: string) {
    return this.uploads.filter((u) => u.permitId === permitId);
  }

  async create(record: Omit<GeoUploadRecord, "id" | "uploadedAt">) {
    const upload: GeoUploadRecord = {
      ...record,
      id: `geo-${uuidv4().slice(0, 8)}`,
      uploadedAt: new Date().toISOString(),
    };
    this.uploads.push(upload);
    return upload;
  }

  async delete(id: string) {
    const before = this.uploads.length;
    this.uploads = this.uploads.filter((u) => u.id !== id);
    return this.uploads.length < before;
  }
}

const vehicleRepo = new MockVehicleRepository();
const permitRepo = new MockPermitRepository();
const geoRepo = new MockGeoRepository();

export function getVehicleRepository(): VehicleRepository {
  return vehicleRepo;
}

export function getPermitRepository(): PermitRepository {
  return permitRepo;
}

export function getGeoRepository(): GeoRepository {
  return geoRepo;
}
